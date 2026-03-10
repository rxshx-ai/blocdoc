from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class DocumentType(str, Enum):
    transport_permit = "transport_permit"
    delivery_receipt = "delivery_receipt"
    ai_provider_selection_explanation = "ai_provider_selection_explanation"


class DocumentUploadResponse(BaseModel):
    shipment_id: str
    document_type: DocumentType
    filename: str
    cid: str
    cid_hash: str
    blockchain_tx_hash: str
    uploaded_at: datetime
