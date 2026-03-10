from pydantic import BaseModel


class ProviderBid(BaseModel):
    shipment_id: str
    provider_id: str
    amount: float
