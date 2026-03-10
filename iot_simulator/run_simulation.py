from __future__ import annotations

import argparse
import asyncio

import httpx

from simulator import DeviceConfig, IoTSimulationEngine, TelemetryDevice, default_packet_printer


def build_devices(device_count: int, interval_seconds: float) -> list[TelemetryDevice]:
    devices: list[TelemetryDevice] = []

    pickup_latitude = 12.9715987
    pickup_longitude = 77.594566
    delivery_latitude = 12.935223
    delivery_longitude = 77.624481

    for i in range(device_count):
        config = DeviceConfig(
            device_id=f"device-{i + 1:03d}",
            shipment_id=f"SHP-IOT-{i + 1:03d}",
            pickup_latitude=pickup_latitude,
            pickup_longitude=pickup_longitude,
            delivery_latitude=delivery_latitude,
            delivery_longitude=delivery_longitude,
            interval_seconds=interval_seconds,
            base_temperature_c=5.0 + (i * 0.15),
            base_humidity_pct=45.0 + (i * 0.5),
            average_speed_mps=10.0 + (i % 3),
        )
        devices.append(TelemetryDevice(config))

    return devices


async def _main() -> None:
    parser = argparse.ArgumentParser(description="IoT shipment telemetry simulator")
    parser.add_argument("--devices", type=int, default=3, help="Number of concurrent devices")
    parser.add_argument(
        "--interval",
        type=float,
        default=3.0,
        help="Seconds between telemetry packets per device",
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=60.0,
        help="Simulation run duration in seconds",
    )
    parser.add_argument(
        "--endpoint",
        type=str,
        default="",
        help="Optional HTTP endpoint to POST telemetry packets",
    )
    parser.add_argument(
        "--register-endpoint",
        type=str,
        default="",
        help="Optional endpoint to register device public keys before simulation",
    )
    args = parser.parse_args()

    devices = build_devices(device_count=args.devices, interval_seconds=args.interval)

    print("Starting simulator with devices:")
    for device in devices:
        print(
            f"- {device.config.device_id} (shipment={device.config.shipment_id}, public_key={device.public_key_hex})"
        )

    if args.register_endpoint:
        async with httpx.AsyncClient(timeout=5.0) as client:
            for device in devices:
                response = await client.post(
                    args.register_endpoint,
                    json={
                        "device_id": device.config.device_id,
                        "shipment_id": device.config.shipment_id,
                        "public_key_hex": device.public_key_hex,
                    },
                )
                response.raise_for_status()
        print("Registered all device public keys")

    engine = IoTSimulationEngine(
        devices=devices,
        packet_handler=default_packet_printer,
        http_endpoint=args.endpoint or None,
    )

    await engine.run(duration_seconds=args.duration)
    print("Simulation completed")


if __name__ == "__main__":
    asyncio.run(_main())
