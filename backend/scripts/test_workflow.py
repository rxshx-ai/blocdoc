import argparse
import base64
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image

BASE_URL = "http://127.0.0.1:8000"

MANAGER_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PROVIDER_KEY = "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
PROVIDER_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"


def post(path: str, payload: dict) -> dict:
    response = requests.post(f"{BASE_URL}{path}", json=payload, timeout=30)
    if response.status_code >= 400:
        raise RuntimeError(f"{path} failed: {response.status_code} {response.text}")
    return response.json()


def get(path: str) -> dict:
    response = requests.get(f"{BASE_URL}{path}", timeout=30)
    if response.status_code >= 400:
        raise RuntimeError(f"{path} failed: {response.status_code} {response.text}")
    return response.json()


def save_and_show_qr(base64_png: str, output_path: Path, show: bool) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    png_bytes = base64.b64decode(base64_png)
    output_path.write_bytes(png_bytes)

    if show:
        try:
            Image.open(BytesIO(png_bytes)).show()
        except Exception as exc:
            print(f"QR image show skipped: {exc}")


def assert_status(shipment: dict, expected: str) -> None:
    actual = shipment["status"]
    if actual != expected:
        raise AssertionError(f"Expected status {expected}, got {actual}")


def main(show_qr: bool) -> None:
    shipment_id = f"SHP-WORKFLOW-{int(datetime.now(timezone.utc).timestamp())}"

    print("1) Create shipment")
    create_resp = post(
        "/shipment/create",
        {
            "shipment_id": shipment_id,
            "sender_entity": "HOSPITAL",
            "receiver_entity": "DIAGNOSTIC_LABORATORY",
            "pickup_location": "Hospital A Loading Bay",
            "delivery_location": "Lab B Main Receiving",
            "pickup_latitude": 12.97160,
            "pickup_longitude": 77.59460,
            "delivery_latitude": 12.97210,
            "delivery_longitude": 77.59510,
            "cargo_type": "Blood Samples",
            "temperature_requirement": 4,
            "escrow_amount_wei": 0,
            "signer_private_key": MANAGER_KEY,
        },
    )
    assert_status(create_resp["shipment"], "CREATED")

    print("2) Submit provider bids")
    post(
        "/bid",
        {
            "shipment_id": shipment_id,
            "provider_id": "PROV-1",
            "provider_address": PROVIDER_ADDRESS,
            "price": 1000000000000000,
            "estimated_delivery_time": 3600,
            "vehicle_type": "Refrigerated Van",
            "driver_id": "DRV-1",
            "signer_private_key": PROVIDER_KEY,
        },
    )
    post(
        "/bid",
        {
            "shipment_id": shipment_id,
            "provider_id": "PROV-2",
            "provider_address": PROVIDER_ADDRESS,
            "price": 1300000000000000,
            "estimated_delivery_time": 4000,
            "vehicle_type": "Cold Chain Truck",
            "driver_id": "DRV-1",
            "signer_private_key": PROVIDER_KEY,
        },
    )

    print("3) AI provider selection")
    select_resp = post(
        "/shipment/select_provider",
        {
            "shipment_id": shipment_id,
            "signer_private_key": MANAGER_KEY,
        },
    )
    assert_status(select_resp["shipment"], "PROVIDER_SELECTED")

    print("4) Driver arrived at pickup")
    arrived_pickup = post(
        "/shipment/arrived_pickup",
        {
            "driver_id": "DRV-1",
            "shipment_id": shipment_id,
            "driver_latitude": 12.97160,
            "driver_longitude": 77.59460,
        },
    )
    save_and_show_qr(
        arrived_pickup["qr_image_base64"],
        Path("backend/tmp/pickup_qr.png"),
        show_qr,
    )

    pickup_expiration = datetime.fromisoformat(arrived_pickup["qr_payload"]["expiration_time"])
    pickup_ttl_seconds = (pickup_expiration - datetime.now(timezone.utc)).total_seconds()
    if not (590 <= pickup_ttl_seconds <= 610):
        raise AssertionError(f"Pickup QR TTL is not 10 minutes: {pickup_ttl_seconds}")

    print("5) Verify pickup QR")
    pickup_payload = arrived_pickup["qr_payload"]
    pickup_verify = post(
        "/shipment/verify_pickup_qr",
        {
            **pickup_payload,
            "driver_id": "DRV-1",
            "driver_latitude": 12.97160,
            "driver_longitude": 77.59460,
            "signer_private_key": PROVIDER_KEY,
        },
    )
    assert_status(pickup_verify["shipment"], "IN_TRANSIT")

    print("6) Driver arrived at delivery")
    arrived_delivery = post(
        "/shipment/arrived_delivery",
        {
            "driver_id": "DRV-1",
            "shipment_id": shipment_id,
            "driver_latitude": 12.97210,
            "driver_longitude": 77.59510,
        },
    )
    save_and_show_qr(
        arrived_delivery["qr_image_base64"],
        Path("backend/tmp/delivery_qr.png"),
        show_qr,
    )

    delivery_expiration = datetime.fromisoformat(arrived_delivery["qr_payload"]["expiration_time"])
    delivery_ttl_seconds = (delivery_expiration - datetime.now(timezone.utc)).total_seconds()
    if not (590 <= delivery_ttl_seconds <= 610):
        raise AssertionError(f"Delivery QR TTL is not 10 minutes: {delivery_ttl_seconds}")

    print("7) Verify delivery QR")
    delivery_payload = arrived_delivery["qr_payload"]
    delivery_verify = post(
        "/shipment/verify_delivery_qr",
        {
            **delivery_payload,
            "driver_id": "DRV-1",
            "driver_latitude": 12.97210,
            "driver_longitude": 77.59510,
            "telemetry_hash": "QmWorkflowTelemetryHash001",
            "signer_private_key": MANAGER_KEY,
        },
    )
    assert_status(delivery_verify["shipment"], "DELIVERED")

    print("8) Nonce reuse check")
    reuse_resp = requests.post(
        f"{BASE_URL}/shipment/verify_delivery_qr",
        json={
            **delivery_payload,
            "driver_id": "DRV-1",
            "driver_latitude": 12.97210,
            "driver_longitude": 77.59510,
            "signer_private_key": MANAGER_KEY,
        },
        timeout=30,
    )
    if reuse_resp.status_code < 400:
        raise AssertionError("Expected nonce reuse rejection")

    state = get(f"/shipment/{shipment_id}")
    print("Final shipment status:", state["shipment"]["status"])
    print("Workflow completed successfully.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-show-qr", action="store_true", help="Do not open QR images")
    args = parser.parse_args()
    main(show_qr=not args.no_show_qr)
