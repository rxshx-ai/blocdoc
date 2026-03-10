from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class EntityType(str, Enum):
    pharmaceutical_manufacturer = "PHARMACEUTICAL_MANUFACTURER"
    medical_distribution_center = "MEDICAL_DISTRIBUTION_CENTER"
    hospital = "HOSPITAL"
    healthcare_provider = "HEALTHCARE_PROVIDER"
    diagnostic_laboratory = "DIAGNOSTIC_LABORATORY"
    transportation_provider = "LICENSED_MEDICAL_TRANSPORTATION_PROVIDER"
    healthcare_admin = "HEALTHCARE_ADMINISTRATOR"
    regulatory_body = "REGULATORY_BODY"


class ShipmentStatus(str, Enum):
    created = "CREATED"
    bidding = "BIDDING"
    provider_selected = "PROVIDER_SELECTED"
    in_transit = "IN_TRANSIT"
    delivered = "DELIVERED"


class CreateShipmentRequest(BaseModel):
    shipment_id: str
    sender_entity: EntityType
    receiver_entity: EntityType
    sender_name: str | None = None
    sender_contact: str | None = None
    receiver_name: str | None = None
    receiver_contact: str | None = None
    pickup_location: str
    delivery_location: str
    pickup_latitude: float
    pickup_longitude: float
    delivery_latitude: float
    delivery_longitude: float
    pickup_time: datetime | None = None
    cargo_type: str
    temperature_requirement: int
    handling_notes: str | None = None
    escrow_amount_wei: int = 0
    signer_private_key: str | None = None


class SubmitBidRequest(BaseModel):
    shipment_id: str
    provider_id: str
    provider_address: str
    price: int = Field(ge=0)
    estimated_delivery_time: int = Field(ge=0)
    vehicle_type: str
    driver_id: str
    signer_private_key: str | None = None


class SelectProviderRequest(BaseModel):
    shipment_id: str
    signer_private_key: str | None = None


class ArrivalRequest(BaseModel):
    driver_id: str
    shipment_id: str
    driver_latitude: float
    driver_longitude: float


class PickupQrVerifyRequest(BaseModel):
    shipment_id: str
    pickup_location_hash: str
    nonce: str
    expiration_time: datetime
    driver_id: str
    driver_latitude: float
    driver_longitude: float
    signer_private_key: str | None = None


class DeliveryQrVerifyRequest(BaseModel):
    shipment_id: str
    delivery_location_hash: str
    nonce: str
    expiration_time: datetime
    driver_id: str
    driver_latitude: float
    driver_longitude: float
    telemetry_hash: str | None = None
    signer_private_key: str | None = None
