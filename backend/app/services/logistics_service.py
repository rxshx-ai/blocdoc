import base64
import hashlib
import io
import secrets
from datetime import UTC, datetime, timedelta

import qrcode
from web3 import Web3

from app.models.logistics_requests import (
    ArrivalRequest,
    CreateShipmentRequest,
    DeliveryQrVerifyRequest,
    PickupQrVerifyRequest,
    SelectProviderRequest,
    ShipmentStatus,
    SubmitBidRequest,
)
from app.services.ai_provider_selection_service import AIProviderSelectionService
from app.services.blockchain_service import BlockchainService
from app.services.geo_service import GeoService
from app.services.storage import DataStore


class LogisticsService:
    def __init__(self, store: DataStore, blockchain: BlockchainService) -> None:
        self._shipments: dict[str, dict] = store.get_map_collection("shipments")
        self._bids: dict[str, list[dict]] = store.get_map_collection("provider_bids")
        self._qr_tokens: dict[str, dict] = store.get_map_collection("qr_tokens")
        self._used_qr_nonces: dict[str, bool] = store.get_map_collection("used_qr_nonces")
        self._blockchain = blockchain
        self._ai_selection = AIProviderSelectionService()
        self._geo = GeoService()
        self._proximity_threshold_meters = 15.0
        self._qr_expiration_minutes = 10

    def create_shipment(self, payload: CreateShipmentRequest) -> dict:
        if payload.shipment_id in self._shipments:
            raise ValueError("Shipment already exists")

        tx_hash = self._blockchain.create_shipment(
            shipment_id=payload.shipment_id,
            pickup_location=payload.pickup_location,
            delivery_location=payload.delivery_location,
            cargo_type=payload.cargo_type,
            temperature_requirement=payload.temperature_requirement,
            escrow_amount_wei=payload.escrow_amount_wei,
            signer_private_key=payload.signer_private_key,
        )

        self._shipments[payload.shipment_id] = {
            "shipment_id": payload.shipment_id,
            "sender_entity": payload.sender_entity.value,
            "receiver_entity": payload.receiver_entity.value,
            "sender_name": payload.sender_name,
            "sender_contact": payload.sender_contact,
            "receiver_name": payload.receiver_name,
            "receiver_contact": payload.receiver_contact,
            "pickup_location": payload.pickup_location,
            "delivery_location": payload.delivery_location,
            "pickup_latitude": payload.pickup_latitude,
            "pickup_longitude": payload.pickup_longitude,
            "delivery_latitude": payload.delivery_latitude,
            "delivery_longitude": payload.delivery_longitude,
            "pickup_time": payload.pickup_time.isoformat() if payload.pickup_time else None,
            "cargo_type": payload.cargo_type,
            "temperature_requirement": payload.temperature_requirement,
            "handling_notes": payload.handling_notes,
            "status": ShipmentStatus.created.value,
            "selected_provider": None,
            "assigned_driver_id": None,
            "tx_hashes": {"create": tx_hash},
        }

        return {"shipment": self._shipments[payload.shipment_id], "tx_hash": tx_hash}

    def submit_bid(self, payload: SubmitBidRequest) -> dict:
        try:
            shipment = self._shipments.get(payload.shipment_id)
            if shipment is None:
                raise ValueError("Shipment does not exist")

            signer_address = self._blockchain.resolve_signer_address(payload.signer_private_key)
            if signer_address and signer_address.lower() != payload.provider_address.lower():
                raise ValueError("provider_address does not match signer_private_key")

            tx_hash = self._blockchain.submit_provider_bid(
                shipment_id=payload.shipment_id,
                price=payload.price,
                estimated_delivery_time=payload.estimated_delivery_time,
                vehicle_type=payload.vehicle_type,
                signer_private_key=payload.signer_private_key,
            )

            bid_record = {
                "provider_id": payload.provider_id,
                "provider_address": Web3.to_checksum_address(payload.provider_address),
                "price": payload.price,
                "estimated_delivery_time": payload.estimated_delivery_time,
                "vehicle_type": payload.vehicle_type,
                "driver_id": payload.driver_id,
                "tx_hash": tx_hash,
            }
            self._bids.setdefault(payload.shipment_id, []).append(bid_record)
            if shipment["status"] == ShipmentStatus.created.value:
                shipment["status"] = ShipmentStatus.bidding.value

            return {"bid": bid_record, "tx_hash": tx_hash}
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise e

    def select_provider_with_ai(self, payload: SelectProviderRequest) -> dict:
        shipment = self._shipments.get(payload.shipment_id)
        if shipment is None:
            raise ValueError("Shipment does not exist")

        if shipment["status"] not in {ShipmentStatus.created.value, ShipmentStatus.bidding.value}:
            raise ValueError("Shipment is not in a selectable bidding state")

        bids = self._bids.get(payload.shipment_id, [])
        best_bid = self._ai_selection.select_best_bid(bids)

        tx_hash = self._blockchain.record_provider_selection(
            shipment_id=payload.shipment_id,
            provider_address=best_bid["provider_address"],
            signer_private_key=payload.signer_private_key,
        )

        shipment["selected_provider"] = best_bid["provider_address"]
        shipment["assigned_driver_id"] = best_bid["driver_id"]
        shipment["status"] = ShipmentStatus.provider_selected.value
        shipment["tx_hashes"]["select_provider"] = tx_hash

        return {
            "shipment": shipment,
            "selected_bid": best_bid,
            "tx_hash": tx_hash,
        }

    def arrived_pickup(self, payload: ArrivalRequest) -> dict:
        shipment = self._get_assigned_shipment(payload.shipment_id, payload.driver_id)
        if shipment["status"] != ShipmentStatus.provider_selected.value:
            raise ValueError("Shipment is not ready for pickup")

        distance = self._geo.distance_meters(
            payload.driver_latitude,
            payload.driver_longitude,
            shipment["pickup_latitude"],
            shipment["pickup_longitude"],
        )
        if distance > self._proximity_threshold_meters:
            raise ValueError("Driver is not within 15 meters of pickup location")

        payload_map = {
            "shipment_id": payload.shipment_id,
            "pickup_location_hash": self._location_hash(shipment["pickup_location"]),
        }
        qr_info = self._generate_qr_token(payload_map, token_type="pickup")
        self._qr_tokens[f"pickup:{payload.shipment_id}"] = {
            **qr_info,
            "driver_id": payload.driver_id,
        }
        return {
            "shipment_id": payload.shipment_id,
            "distance_meters": round(distance, 3),
            "qr_payload": qr_info["payload"],
            "qr_image_base64": qr_info["image_base64"],
            "qr_image_data_uri": f"data:image/png;base64,{qr_info['image_base64']}",
        }

    def verify_pickup_qr(self, payload: PickupQrVerifyRequest) -> dict:
        shipment = self._get_assigned_shipment(payload.shipment_id, payload.driver_id)
        if shipment["status"] != ShipmentStatus.provider_selected.value:
            raise ValueError("Shipment is not ready for pickup verification")

        cached = self._qr_tokens.get(f"pickup:{payload.shipment_id}")
        self._validate_qr(
            cached_payload=cached,
            provided_payload={
                "shipment_id": payload.shipment_id,
                "pickup_location_hash": payload.pickup_location_hash,
                "nonce": payload.nonce,
                "expiration_time": payload.expiration_time,
            },
            expected_type="pickup",
            expected_location_hash=self._location_hash(shipment["pickup_location"]),
        )

        distance = self._geo.distance_meters(
            payload.driver_latitude,
            payload.driver_longitude,
            shipment["pickup_latitude"],
            shipment["pickup_longitude"],
        )
        if distance > self._proximity_threshold_meters:
            raise ValueError("Driver is not within 15 meters of pickup location")

        tx_hash = self._blockchain.record_pickup_verification(
            shipment_id=payload.shipment_id,
            signer_private_key=payload.signer_private_key,
        )
        shipment["status"] = ShipmentStatus.in_transit.value
        shipment["tx_hashes"]["pickup"] = tx_hash
        self._used_qr_nonces[payload.nonce] = True

        return {"shipment": shipment, "tx_hash": tx_hash, "distance_meters": round(distance, 3)}

    def arrived_delivery(self, payload: ArrivalRequest) -> dict:
        shipment = self._get_assigned_shipment(payload.shipment_id, payload.driver_id)
        if shipment["status"] != ShipmentStatus.in_transit.value:
            raise ValueError("Shipment is not in transit")

        distance = self._geo.distance_meters(
            payload.driver_latitude,
            payload.driver_longitude,
            shipment["delivery_latitude"],
            shipment["delivery_longitude"],
        )
        if distance > self._proximity_threshold_meters:
            raise ValueError("Driver is not within 15 meters of delivery location")

        payload_map = {
            "shipment_id": payload.shipment_id,
            "delivery_location_hash": self._location_hash(shipment["delivery_location"]),
        }
        qr_info = self._generate_qr_token(payload_map, token_type="delivery")
        self._qr_tokens[f"delivery:{payload.shipment_id}"] = {
            **qr_info,
            "driver_id": payload.driver_id,
        }
        return {
            "shipment_id": payload.shipment_id,
            "distance_meters": round(distance, 3),
            "qr_payload": qr_info["payload"],
            "qr_image_base64": qr_info["image_base64"],
            "qr_image_data_uri": f"data:image/png;base64,{qr_info['image_base64']}",
        }

    def verify_delivery_qr(self, payload: DeliveryQrVerifyRequest) -> dict:
        shipment = self._get_assigned_shipment(payload.shipment_id, payload.driver_id)
        if shipment["status"] != ShipmentStatus.in_transit.value:
            raise ValueError("Shipment status must be IN_TRANSIT")

        cached = self._qr_tokens.get(f"delivery:{payload.shipment_id}")
        self._validate_qr(
            cached_payload=cached,
            provided_payload={
                "shipment_id": payload.shipment_id,
                "delivery_location_hash": payload.delivery_location_hash,
                "nonce": payload.nonce,
                "expiration_time": payload.expiration_time,
            },
            expected_type="delivery",
            expected_location_hash=self._location_hash(shipment["delivery_location"]),
        )

        distance = self._geo.distance_meters(
            payload.driver_latitude,
            payload.driver_longitude,
            shipment["delivery_latitude"],
            shipment["delivery_longitude"],
        )
        if distance > self._proximity_threshold_meters:
            raise ValueError("Driver is not within 15 meters of delivery location")

        telemetry_tx = None
        if payload.telemetry_hash:
            telemetry_tx = self._blockchain.log_telemetry_hash(
                shipment_id=payload.shipment_id,
                telemetry_hash=payload.telemetry_hash,
                signer_private_key=None,
            )
            shipment["tx_hashes"]["telemetry"] = telemetry_tx

        tx_hash = self._blockchain.record_delivery_confirmation(
            shipment_id=payload.shipment_id,
            signer_private_key=payload.signer_private_key,
        )
        shipment["status"] = ShipmentStatus.delivered.value
        shipment["tx_hashes"]["delivery"] = tx_hash
        self._used_qr_nonces[payload.nonce] = True

        return {
            "shipment": shipment,
            "tx_hash": tx_hash,
            "telemetry_tx_hash": telemetry_tx,
            "distance_meters": round(distance, 3),
        }

    def get_shipment(self, shipment_id: str) -> dict:
        shipment = self._shipments.get(shipment_id)
        if shipment is None:
            raise ValueError("Shipment does not exist")
        return shipment

    def list_shipments(self) -> list[dict]:
        return list(self._shipments.values())

    def list_bids(self, shipment_id: str) -> list[dict]:
        return list(self._bids.get(shipment_id, []))

    def get_pickup_qr(self, shipment_id: str) -> dict:
        shipment = self._shipments.get(shipment_id)
        if shipment is None:
            raise ValueError("Shipment does not exist")

        cached = self._qr_tokens.get(f"pickup:{shipment_id}")
        if cached is None:
            raise ValueError("Pickup QR not generated yet")

        return {
            "shipment_id": shipment_id,
            "status": shipment["status"],
            "assigned_driver_id": shipment.get("assigned_driver_id"),
            "qr_payload": cached["payload"],
            "qr_image_base64": cached["image_base64"],
            "qr_image_data_uri": f"data:image/png;base64,{cached['image_base64']}",
            "created_at": cached.get("created_at"),
        }

    def get_delivery_qr(self, shipment_id: str) -> dict:
        shipment = self._shipments.get(shipment_id)
        if shipment is None:
            raise ValueError("Shipment does not exist")

        cached = self._qr_tokens.get(f"delivery:{shipment_id}")
        if cached is None:
            raise ValueError("Delivery QR not generated yet")

        return {
            "shipment_id": shipment_id,
            "status": shipment["status"],
            "assigned_driver_id": shipment.get("assigned_driver_id"),
            "qr_payload": cached["payload"],
            "qr_image_base64": cached["image_base64"],
            "qr_image_data_uri": f"data:image/png;base64,{cached['image_base64']}",
            "created_at": cached.get("created_at"),
        }

    def _generate_qr_token(self, base_payload: dict, token_type: str) -> dict:
        nonce = secrets.token_hex(16)
        expiration_time = datetime.now(UTC) + timedelta(minutes=self._qr_expiration_minutes)
        payload = {
            **base_payload,
            "nonce": nonce,
            "expiration_time": expiration_time.isoformat(),
        }

        image = qrcode.make(payload)
        image_buffer = io.BytesIO()
        image.save(image_buffer, format="PNG")
        image_base64 = base64.b64encode(image_buffer.getvalue()).decode("ascii")

        return {
            "type": token_type,
            "payload": payload,
            "image_base64": image_base64,
            "created_at": datetime.now(UTC).isoformat(),
        }

    def _validate_qr(
        self,
        cached_payload: dict | None,
        provided_payload: dict,
        expected_type: str,
        expected_location_hash: str,
    ) -> None:
        if cached_payload is None:
            raise ValueError("QR token not generated for this shipment")
        if cached_payload.get("type") != expected_type:
            raise ValueError("Invalid QR token type")

        nonce = provided_payload["nonce"]
        if self._used_qr_nonces.get(nonce):
            raise ValueError("QR nonce has already been used")

        cached_qr = cached_payload["payload"]
        if cached_qr.get("shipment_id") != provided_payload["shipment_id"]:
            raise ValueError("QR shipment_id mismatch")

        hash_key = "pickup_location_hash" if expected_type == "pickup" else "delivery_location_hash"
        if provided_payload.get(hash_key) != expected_location_hash:
            raise ValueError("QR location hash mismatch")

        if cached_qr.get("nonce") != nonce:
            raise ValueError("QR nonce mismatch")

        provided_expiration = provided_payload["expiration_time"]
        if provided_expiration.tzinfo is None:
            provided_expiration = provided_expiration.replace(tzinfo=UTC)
        cached_expiration = datetime.fromisoformat(cached_qr["expiration_time"])
        if cached_expiration.tzinfo is None:
            cached_expiration = cached_expiration.replace(tzinfo=UTC)

        if provided_expiration != cached_expiration:
            raise ValueError("QR expiration mismatch")

        if datetime.now(UTC) > provided_expiration:
            raise ValueError("QR token expired")

    def _location_hash(self, location_text: str) -> str:
        return hashlib.sha256(location_text.encode("utf-8")).hexdigest()

    def _get_assigned_shipment(self, shipment_id: str, driver_id: str) -> dict:
        shipment = self._shipments.get(shipment_id)
        if shipment is None:
            raise ValueError("Shipment does not exist")
        if not shipment.get("assigned_driver_id"):
            raise ValueError("No driver is assigned to this shipment")
        if shipment["assigned_driver_id"] != driver_id:
            raise ValueError("Driver does not match assigned driver")
        return shipment
