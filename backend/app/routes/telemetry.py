from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_telemetry_service
from app.models.telemetry_requests import RegisterTelemetryDeviceRequest, TelemetryIngestRequest
from app.services.telemetry_service import TelemetryService

router = APIRouter(tags=["telemetry"])


@router.post("/telemetry/register_device")
def register_device(
    payload: RegisterTelemetryDeviceRequest,
    service: TelemetryService = Depends(get_telemetry_service),
) -> dict:
    try:
        return service.register_device(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/telemetry/ingest")
def ingest_telemetry(
    payload: TelemetryIngestRequest,
    service: TelemetryService = Depends(get_telemetry_service),
) -> dict:
    try:
        return service.ingest(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/telemetry")
def ingest_telemetry_primary(
    payload: TelemetryIngestRequest,
    service: TelemetryService = Depends(get_telemetry_service),
) -> dict:
    try:
        return service.ingest(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/telemetry/shipment/{shipment_id}")
def list_telemetry_by_shipment(
    shipment_id: str,
    service: TelemetryService = Depends(get_telemetry_service),
) -> dict:
    return {"events": service.list_by_shipment(shipment_id)}
