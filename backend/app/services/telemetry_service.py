import base64
import hashlib
import json
from datetime import UTC, datetime
from typing import Any

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from app.config.settings import Settings
from app.services.blockchain_service import BlockchainService
from app.services.geo_service import GeoService
from app.models.telemetry_requests import RegisterTelemetryDeviceRequest, TelemetryIngestRequest
from app.services.storage import DataStore


class TelemetryService:
    def __init__(self, store: DataStore, blockchain: BlockchainService, settings: Settings) -> None:
        self._telemetry_events = store.get_collection("telemetry_events")
        self._devices: dict[str, dict[str, str]] = store.get_map_collection("telemetry_devices")
        self._latest_seq: dict[str, int] = store.get_map_collection("telemetry_latest_sequence")
        self._latest_packet_by_device: dict[str, dict[str, Any]] = store.get_map_collection(
            "telemetry_latest_packet"
        )
        self._pending_batches: dict[str, list[dict[str, Any]]] = store.get_map_collection(
            "telemetry_pending_batches"
        )
        self._last_batch_time: dict[str, float] = store.get_map_collection("telemetry_last_batch_time")
        self._batch_hashes = store.get_collection("telemetry_batch_hashes")

        self._blockchain = blockchain
        self._settings = settings
        self._geo = GeoService()

    def register_device(self, payload: RegisterTelemetryDeviceRequest) -> dict:
        self._devices[payload.device_id] = {
            "shipment_id": payload.shipment_id,
            "public_key_hex": payload.public_key_hex,
        }
        self._latest_seq[payload.device_id] = 0
        return {"device_id": payload.device_id, "shipment_id": payload.shipment_id, "registered": True}

    def ingest(self, payload: TelemetryIngestRequest) -> dict:
        device = self._devices.get(payload.device_id)
        if not device:
            raise ValueError("Device is not registered")

        if device["shipment_id"] != payload.shipment_id:
            raise ValueError("Shipment mismatch for device")

        previous_seq = self._latest_seq.get(payload.device_id, 0)
        if payload.sequence_number <= previous_seq:
            raise ValueError("Out-of-order sequence number")

        packet = payload.model_dump()

        packet_timestamp = self._parse_timestamp(packet["timestamp"])
        self._validate_timestamp(packet_timestamp)

        if not self._verify_signature(packet, device["public_key_hex"]):
            raise ValueError("Invalid telemetry signature")

        self._validate_temperature(packet["temperature"])
        self._validate_speed(payload.device_id, packet, packet_timestamp)

        self._latest_seq[payload.device_id] = payload.sequence_number
        self._telemetry_events.append(packet)
        self._latest_packet_by_device[payload.device_id] = packet

        pending = self._pending_batches.setdefault(payload.shipment_id, [])
        pending.append(packet)

        batch_result = self._flush_batch_if_due(payload.shipment_id, packet_timestamp)

        return {
            "accepted": True,
            "device_id": payload.device_id,
            "shipment_id": payload.shipment_id,
            "sequence_number": payload.sequence_number,
            "batch_flush": batch_result,
        }

    def list_by_shipment(self, shipment_id: str) -> list[dict[str, Any]]:
        return [event for event in self._telemetry_events if event.get("shipment_id") == shipment_id]

    def _verify_signature(self, packet: dict[str, Any], public_key_hex: str) -> bool:
        try:
            raw_public_key = bytes.fromhex(public_key_hex)
            public_key = Ed25519PublicKey.from_public_bytes(raw_public_key)
            signature = base64.b64decode(packet["digital_signature"])

            unsigned_packet = dict(packet)
            unsigned_packet.pop("digital_signature", None)
            canonical = json.dumps(
                unsigned_packet,
                sort_keys=True,
                separators=(",", ":"),
            ).encode("utf-8")

            public_key.verify(signature, canonical)
            return True
        except (KeyError, ValueError, InvalidSignature):
            return False

    def _parse_timestamp(self, timestamp: str) -> datetime:
        try:
            parsed = datetime.fromisoformat(timestamp)
        except ValueError as exc:
            raise ValueError("Invalid timestamp format") from exc

        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=UTC)
        return parsed

    def _validate_timestamp(self, packet_timestamp: datetime) -> None:
        now = datetime.now(UTC)
        delta = abs((now - packet_timestamp).total_seconds())
        if delta > self._settings.telemetry_time_window_seconds:
            raise ValueError("Telemetry timestamp outside acceptable time window")

    def _validate_temperature(self, temperature: float) -> None:
        if temperature < self._settings.telemetry_temperature_min_c:
            raise ValueError("Temperature below realistic limit")
        if temperature > self._settings.telemetry_temperature_max_c:
            raise ValueError("Temperature above realistic limit")

    def _validate_speed(self, device_id: str, packet: dict[str, Any], packet_timestamp: datetime) -> None:
        previous = self._latest_packet_by_device.get(device_id)
        if previous is None:
            return

        previous_timestamp = self._parse_timestamp(previous["timestamp"])
        time_delta_seconds = (packet_timestamp - previous_timestamp).total_seconds()
        if time_delta_seconds <= 0:
            raise ValueError("Telemetry timestamp is not increasing")

        distance_m = self._geo.distance_meters(
            previous["latitude"],
            previous["longitude"],
            packet["latitude"],
            packet["longitude"],
        )
        speed_mps = distance_m / time_delta_seconds
        if speed_mps > self._settings.telemetry_max_speed_mps:
            raise ValueError("GPS movement exceeds realistic speed")

    def _flush_batch_if_due(self, shipment_id: str, now: datetime) -> dict | None:
        interval = self._settings.telemetry_batch_interval_seconds
        now_ts = now.timestamp()
        if shipment_id not in self._last_batch_time:
            self._last_batch_time[shipment_id] = now_ts
            return None

        last_ts = float(self._last_batch_time.get(shipment_id, now_ts))

        pending = self._pending_batches.get(shipment_id, [])
        if not pending:
            return None

        if now_ts - last_ts < interval:
            return None

        batch_payload = json.dumps(pending, sort_keys=True, separators=(",", ":")).encode("utf-8")
        batch_hash = hashlib.sha256(batch_payload).hexdigest()
        tx_hash = self._blockchain.log_telemetry_hash(
            shipment_id=shipment_id,
            telemetry_hash=batch_hash,
            signer_private_key=None,
        )

        batch_record = {
            "shipment_id": shipment_id,
            "event_count": len(pending),
            "hash": batch_hash,
            "tx_hash": tx_hash,
            "timestamp": now.isoformat(),
        }
        self._batch_hashes.append(batch_record)
        self._pending_batches[shipment_id] = []
        self._last_batch_time[shipment_id] = now_ts
        return batch_record
