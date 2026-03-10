from pydantic import BaseModel


class Shipment(BaseModel):
    shipment_id: str
    status: str = "created"
