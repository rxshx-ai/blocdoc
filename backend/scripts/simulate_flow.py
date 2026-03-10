import requests
import time
import json

BASE_URL = "http://127.0.0.1:8000"

def login(username, password):
    res = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    res.raise_for_status()
    return res.json()["access_token"]

def request(method, path, token=None, json_data=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    url = f"{BASE_URL}{path}"
    if method == "GET":
        res = requests.get(url, headers=headers, json=json_data)
    else:
        res = requests.post(url, headers=headers, json=json_data)
    
    try:
        res.raise_for_status()
    except requests.exceptions.HTTPError as e:
        print(f"Error on {method} {path}: {res.text}")
        raise e
    return res.json()

def create_user(username, password, role, actor_id):
    res = requests.post(
        f"{BASE_URL}/admin/users",
        json={"username": username, "password": password, "role": role, "actor_id": actor_id},
        headers={"X-Role": "admin", "X-Actor-Id": "admin-1"}
    )
    if res.status_code == 400 and "already exists" in res.text:
        return
    res.raise_for_status()

def main():
    print("Creating users...")
    create_user("city_hospital", "p1", "shipper", "hsp-001")
    create_user("driver_1", "p1", "provider", "drv-001")
    create_user("driver_2", "p1", "provider", "drv-002")
    create_user("central_lab", "p1", "receiver", "lab-001")

    print("Logging in users...")
    token_shipper = login("city_hospital", "p1")
    token_provider1 = login("driver_1", "p1")
    token_provider2 = login("driver_2", "p1")
    token_receiver = login("central_lab", "p1")

    print("1. Shipper creates a shipment")
    shipment_data = {
        "shipment_id": f"SHP-{int(time.time())}",
        "sender_entity": "HOSPITAL",
        "receiver_entity": "HOSPITAL",
        "cargo_type": "Organs",
        "temperature_requirement": 4.0,
        "pickup_location": "City General Hospital",
        "delivery_location": "Central Lab",
        "pickup_latitude": 40.7128,
        "pickup_longitude": -74.0060,
        "delivery_latitude": 40.7306,
        "delivery_longitude": -73.9866,
        "escrow_amount_wei": 1000000000000
    }
    res = request("POST", "/shipment/create", token_shipper, shipment_data)
    shipment_id = shipment_data["shipment_id"]
    print(f"-> Created Shipment: {shipment_id}")

    print("2. Providers submit bids")
    request("POST", "/bid", token_provider1, {
        "shipment_id": shipment_id,
        "provider_id": "drv-001",
        "provider_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "price": 500,
        "estimated_delivery_time": 2,
        "vehicle_type": "Refrigerated Van",
        "driver_id": "drv-001",
        "signer_private_key": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    })
    print("-> drv-001 (driver_1) bid placed")
    
    request("POST", "/bid", token_provider2, {
        "shipment_id": shipment_id,
        "provider_id": "drv-002",
        "provider_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "price": 550,
        "estimated_delivery_time": 3,
        "vehicle_type": "Refrigerated Truck",
        "driver_id": "drv-002",
        "signer_private_key": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    })
    print("-> drv-002 (driver_2) bid placed")

    time.sleep(1)

    print("3. Shipper selects provider via AI (GraphSAGE PyTorch Model)")
    res = request("POST", "/shipment/select_provider", token_shipper, {
        "shipment_id": shipment_id
    })
    selected_provider = res["selected_bid"]["driver_id"]
    scores = res["selected_bid"].get("scores", {})
    print(f"-> Selected Provider: {selected_provider}")
    print(f"   * GNN Node Success Probability: {scores.get('gnn_prediction_score', 'N/A')}")
    print(f"   * Overall Combined Evaluation Score: {scores.get('combined_score', 'N/A')}")

    # Determine which token to use for driver actions
    token_driver = token_provider1 if selected_provider == "drv-001" else token_provider2

    print("4. Driver arrives at pickup")
    request("POST", "/shipment/arrived_pickup", token_driver, {
        "driver_id": selected_provider,
        "shipment_id": shipment_id,
        "driver_latitude": 40.7128,
        "driver_longitude": -74.0060
    })
    print("-> Driver arrived at pickup (15m validation passed)")

    print("5. Shipper generates QR Code")
    res = request("GET", f"/shipment/{shipment_id}/pickup_qr", token_shipper)
    qr_payload = res["qr_payload"]
    print("-> Pickup QR Payload generated")

    print("6. Driver verifies Pickup QR")
    request("POST", "/shipment/verify_pickup_qr", token_driver, {
        "shipment_id": qr_payload["shipment_id"],
        "nonce": qr_payload["nonce"],
        "expiration_time": qr_payload["expiration_time"],
        "pickup_location_hash": qr_payload["pickup_location_hash"],
        "driver_id": selected_provider,
        "driver_latitude": 40.7128,
        "driver_longitude": -74.0060,
        "signer_private_key": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    })
    print("-> Pickup Verified! Custody Transferred on Chain")

    print("7. Driver arrives at delivery")
    request("POST", "/shipment/arrived_delivery", token_driver, {
        "driver_id": selected_provider,
        "shipment_id": shipment_id,
        "driver_latitude": 40.7306,
        "driver_longitude": -73.9866
    })
    print("-> Driver arrived at delivery (15m validation passed)")

    print("8. Receiver generates Delivery QR")
    res = request("GET", f"/shipment/{shipment_id}/delivery_qr", token_receiver)
    qr_payload = res["qr_payload"]
    print("-> Delivery QR Payload generated")

    print("9. Driver verifies Delivery QR")
    request("POST", "/shipment/verify_delivery_qr", token_driver, {
        "shipment_id": qr_payload["shipment_id"],
        "nonce": qr_payload["nonce"],
        "expiration_time": qr_payload["expiration_time"],
        "delivery_location_hash": qr_payload["delivery_location_hash"],
        "driver_id": selected_provider,
        "driver_latitude": 40.7306,
        "driver_longitude": -73.9866
    })
    print("-> Delivery Verified! Custody Complete on Chain")
    
    print("\n✅ End-to-End Flow Tested Successfully Without Mocks!")

if __name__ == "__main__":
    main()
