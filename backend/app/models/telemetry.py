from pydantic import BaseModel


class TelemetryEvent(BaseModel):
    shipment_id: str
    metric: str
    value: float
