from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_logistics_service
from app.models.logistics_requests import (
    ArrivalRequest,
    CreateShipmentRequest,
    DeliveryQrVerifyRequest,
    PickupQrVerifyRequest,
    SelectProviderRequest,
    SubmitBidRequest,
)
from app.services.logistics_service import LogisticsService
from app.security.rbac import Principal, Role, require_roles

router = APIRouter(tags=["logistics"])


@router.post("/shipment/create")
def create_shipment(
    payload: CreateShipmentRequest,
    service: LogisticsService = Depends(get_logistics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper)),
) -> dict:
    try:
        return service.create_shipment(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/bid")
def submit_bid(
    payload: SubmitBidRequest,
    service: LogisticsService = Depends(get_logistics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.provider)),
) -> dict:
    try:
        if principal.role == Role.provider and principal.actor_id != payload.provider_id:
            raise HTTPException(status_code=403, detail="Provider can only submit bids for own provider_id")
        return service.submit_bid(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/shipment/select_provider")
def select_provider_with_ai(
    payload: SelectProviderRequest,
    service: LogisticsService = Depends(get_logistics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper)),
) -> dict:
    try:
        return service.select_provider_with_ai(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/shipment/arrived_pickup")
def arrived_pickup(
    payload: ArrivalRequest,
    service: LogisticsService = Depends(get_logistics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.driver, Role.provider)),
) -> dict:
    try:
        if principal.role in (Role.driver, Role.provider) and principal.actor_id != payload.driver_id:
            raise HTTPException(status_code=403, detail="Driver can only update own driver_id")
        return service.arrived_pickup(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/shipment/verify_pickup_qr")
def verify_pickup_qr(
    payload: PickupQrVerifyRequest,
    service: LogisticsService = Depends(get_logistics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.driver, Role.provider)),
) -> dict:
    try:
        if principal.role in (Role.driver, Role.provider) and principal.actor_id != payload.driver_id:
            raise HTTPException(status_code=403, detail="Driver can only verify own pickup actions")
        return service.verify_pickup_qr(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/shipment/arrived_delivery")
def arrived_delivery(
    payload: ArrivalRequest,
    service: LogisticsService = Depends(get_logistics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.driver, Role.provider)),
) -> dict:
    try:
        if principal.role in (Role.driver, Role.provider) and principal.actor_id != payload.driver_id:
            raise HTTPException(status_code=403, detail="Driver can only update own driver_id")
        return service.arrived_delivery(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/shipment/verify_delivery_qr")
def verify_delivery_qr(
    payload: DeliveryQrVerifyRequest,
    service: LogisticsService = Depends(get_logistics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.driver, Role.provider)),
) -> dict:
    try:
        if principal.role in (Role.driver, Role.provider) and principal.actor_id != payload.driver_id:
            raise HTTPException(status_code=403, detail="Driver can only verify own delivery actions")
        return service.verify_delivery_qr(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/shipment/{shipment_id}")
def get_shipment(
    shipment_id: str,
    service: LogisticsService = Depends(get_logistics_service),
    principal: Principal = Depends(
        require_roles(Role.admin, Role.shipper, Role.provider, Role.driver, Role.receiver)
    ),
) -> dict:
    try:
        return {"shipment": service.get_shipment(shipment_id)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/shipments")
def list_shipments(
    service: LogisticsService = Depends(get_logistics_service),
    principal: Principal = Depends(
        require_roles(Role.admin, Role.shipper, Role.provider, Role.driver, Role.receiver)
    ),
) -> dict:
    return {"shipments": service.list_shipments()}


@router.get("/shipment/{shipment_id}/bids")
def list_bids(
    shipment_id: str,
    service: LogisticsService = Depends(get_logistics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper, Role.provider)),
) -> dict:
    return {"shipment_id": shipment_id, "bids": service.list_bids(shipment_id)}


@router.get("/shipment/{shipment_id}/pickup_qr")
def get_pickup_qr(
    shipment_id: str,
    service: LogisticsService = Depends(get_logistics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.shipper, Role.driver)),
) -> dict:
    try:
        return service.get_pickup_qr(shipment_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/shipment/{shipment_id}/delivery_qr")
def get_delivery_qr(
    shipment_id: str,
    service: LogisticsService = Depends(get_logistics_service),
    principal: Principal = Depends(require_roles(Role.admin, Role.receiver, Role.driver)),
) -> dict:
    try:
        return service.get_delivery_qr(shipment_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
