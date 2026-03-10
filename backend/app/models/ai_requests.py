from pydantic import BaseModel, Field


class ShipmentData(BaseModel):
    shipment_id: str
    cargo_type: str
    temperature_requirement: float
    distance_km: float = Field(ge=0)
    urgency_level: float = Field(ge=0, le=1)
    hospital_id: str


class ProviderBidInput(BaseModel):
    provider_id: str
    driver_id: str
    vehicle_id: str
    price: float = Field(ge=0)
    estimated_delivery_time: float = Field(ge=0)
    historical_success_rate: float = Field(ge=0, le=1)
    vehicle_reliability: float = Field(ge=0, le=1)


class DriverFeatureInput(BaseModel):
    driver_id: str
    experience_years: float = Field(ge=0)
    on_time_rate: float = Field(ge=0, le=1)
    safety_score: float = Field(ge=0, le=1)


class AISelectProviderRequest(BaseModel):
    shipment_data: ShipmentData
    provider_bids: list[ProviderBidInput]
    driver_features: list[DriverFeatureInput]


class AISelectProviderResponse(BaseModel):
    selected_provider: str
    gnn_success_probability: float
    final_score: float
