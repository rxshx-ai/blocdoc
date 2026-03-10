from __future__ import annotations

import asyncio
import base64
import json
import math
import random
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Awaitable, Callable

import httpx
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)

PacketHandler = Callable[[dict[str, Any]], Awaitable[None] | None]


def _utc_now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_m = 6371000
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return 2 * earth_radius_m * math.asin(math.sqrt(a))


def _interpolate(start: float, end: float, t: float) -> float:
    return start + (end - start) * t


def _canonical_payload(packet: dict[str, Any]) -> bytes:
    unsigned_packet = dict(packet)
    unsigned_packet.pop("digital_signature", None)
    return json.dumps(unsigned_packet, sort_keys=True, separators=(",", ":")).encode("utf-8")


@dataclass
class DeviceConfig:
    device_id: str
    shipment_id: str
    pickup_latitude: float
    pickup_longitude: float
    delivery_latitude: float
    delivery_longitude: float
    interval_seconds: float = 3.0
    base_temperature_c: float = 5.0
    base_humidity_pct: float = 45.0
    average_speed_mps: float = 11.0


class TelemetryDevice:
    def __init__(self, config: DeviceConfig) -> None:
        self.config = config
        self._sequence_number = 0
        self._private_key = Ed25519PrivateKey.generate()
        self._public_key = self._private_key.public_key()

        self._distance_m = _haversine_meters(
            config.pickup_latitude,
            config.pickup_longitude,
            config.delivery_latitude,
            config.delivery_longitude,
        )
        speed = max(config.average_speed_mps, 0.5)
        self._journey_seconds = max(self._distance_m / speed, config.interval_seconds)

    @property
    def public_key_hex(self) -> str:
        raw = self._public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
        return raw.hex()

    def generate_packet(self, elapsed_seconds: float) -> dict[str, Any]:
        self._sequence_number += 1

        progress = min(1.0, max(0.0, elapsed_seconds / self._journey_seconds))
        eased_progress = progress * progress * (3 - 2 * progress)

        latitude = _interpolate(
            self.config.pickup_latitude,
            self.config.delivery_latitude,
            eased_progress,
        )
        longitude = _interpolate(
            self.config.pickup_longitude,
            self.config.delivery_longitude,
            eased_progress,
        )

        gps_noise_m = 2.5 if progress < 1.0 else 0.8
        latitude += random.gauss(0.0, gps_noise_m / 111111)
        longitude += random.gauss(0.0, gps_noise_m / 111111)

        temperature = self.config.base_temperature_c
        temperature += 0.7 * math.sin(self._sequence_number / 4)
        temperature += random.gauss(0.0, 0.15)

        humidity = self.config.base_humidity_pct
        humidity += 2.5 * math.sin(self._sequence_number / 7)
        humidity += random.gauss(0.0, 0.5)

        packet = {
            "device_id": self.config.device_id,
            "shipment_id": self.config.shipment_id,
            "sequence_number": self._sequence_number,
            "temperature": round(temperature, 3),
            "humidity": round(humidity, 3),
            "latitude": round(latitude, 7),
            "longitude": round(longitude, 7),
            "timestamp": _utc_now_iso(),
        }

        signature = self._private_key.sign(_canonical_payload(packet))
        packet["digital_signature"] = base64.b64encode(signature).decode("ascii")
        return packet


def verify_packet_signature(packet: dict[str, Any], public_key_hex: str) -> bool:
    try:
        public_key = Ed25519PublicKey.from_public_bytes(bytes.fromhex(public_key_hex))
        signature = base64.b64decode(packet["digital_signature"])
        public_key.verify(signature, _canonical_payload(packet))
        return True
    except (KeyError, ValueError, InvalidSignature):
        return False


class IoTSimulationEngine:
    def __init__(
        self,
        devices: list[TelemetryDevice],
        packet_handler: PacketHandler | None = None,
        http_endpoint: str | None = None,
        request_timeout_seconds: float = 5.0,
    ) -> None:
        self._devices = devices
        self._packet_handler = packet_handler
        self._http_endpoint = http_endpoint
        self._request_timeout_seconds = request_timeout_seconds
        self._shutdown = asyncio.Event()

    async def run(self, duration_seconds: float | None = None) -> None:
        tasks = [asyncio.create_task(self._run_device(device)) for device in self._devices]

        if duration_seconds is not None:
            try:
                await asyncio.wait_for(self._shutdown.wait(), timeout=duration_seconds)
            except asyncio.TimeoutError:
                self.stop()
        else:
            await self._shutdown.wait()

        await asyncio.gather(*tasks, return_exceptions=True)

    def stop(self) -> None:
        self._shutdown.set()

    async def _run_device(self, device: TelemetryDevice) -> None:
        started = asyncio.get_running_loop().time()

        async with httpx.AsyncClient(timeout=self._request_timeout_seconds) as client:
            while not self._shutdown.is_set():
                now = asyncio.get_running_loop().time()
                elapsed = max(0.0, now - started)
                packet = device.generate_packet(elapsed)

                await self._dispatch_packet(packet, client)
                await asyncio.sleep(device.config.interval_seconds)

    async def _dispatch_packet(self, packet: dict[str, Any], client: httpx.AsyncClient) -> None:
        if self._packet_handler is not None:
            maybe_coroutine = self._packet_handler(packet)
            if asyncio.iscoroutine(maybe_coroutine):
                await maybe_coroutine

        if self._http_endpoint:
            await client.post(self._http_endpoint, json=packet)


def default_packet_printer(packet: dict[str, Any]) -> None:
    print(json.dumps(packet, sort_keys=True))
