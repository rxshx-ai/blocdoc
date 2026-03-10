from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.dependencies import get_ipfs_service
from app.models.ipfs_requests import DocumentType, DocumentUploadResponse
from app.services.ipfs_service import IPFSService

router = APIRouter(tags=["ipfs"])


@router.post("/ipfs/upload", response_model=DocumentUploadResponse)
async def upload_document(
    shipment_id: str = Form(...),
    document_type: DocumentType = Form(...),
    signer_private_key: str | None = Form(default=None),
    file: UploadFile = File(...),
    service: IPFSService = Depends(get_ipfs_service),
) -> DocumentUploadResponse:
    try:
        file_bytes = await file.read()
        record = service.upload_document(
            shipment_id=shipment_id,
            document_type=document_type,
            filename=file.filename or "uploaded_document",
            file_bytes=file_bytes,
            signer_private_key=signer_private_key,
        )
        return DocumentUploadResponse(
            shipment_id=record["shipment_id"],
            document_type=DocumentType(record["document_type"]),
            filename=record["filename"],
            cid=record["cid"],
            cid_hash=record["cid_hash"],
            blockchain_tx_hash=record["blockchain_tx_hash"],
            uploaded_at=datetime.fromisoformat(record["uploaded_at"]),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/ipfs/documents/{shipment_id}")
def list_documents(shipment_id: str, service: IPFSService = Depends(get_ipfs_service)) -> dict:
    return {"documents": service.list_documents(shipment_id)}
