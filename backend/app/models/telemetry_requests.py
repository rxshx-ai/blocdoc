from pydantic import BaseModel


class RegisterTelemetryDeviceRequest(BaseModel):
    device_id: str
    shipment_id: str
    public_key_hex: str


class TelemetryIngestRequest(BaseModel):
    device_id: str
    shipment_id: str
    sequence_number: int
    temperature: float
    humidity: float
    latitude: float
    longitude: float
    timestamp: str
    digital_signature: str
