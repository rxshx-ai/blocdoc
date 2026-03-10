from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_auth_service
from app.models.auth_requests import CreateUserRequest, LoginRequest
from app.security.rbac import Principal, Role, require_roles
from app.services.auth_service import AuthService

router = APIRouter(tags=["auth"])


@router.post("/auth/login")
def login(payload: LoginRequest, auth: AuthService = Depends(get_auth_service)) -> dict:
    try:
        return auth.login(payload.username, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.get("/auth/me")
def me(principal: Principal = Depends(require_roles(Role.admin, Role.shipper, Role.provider, Role.driver, Role.receiver))) -> dict:
    return {"role": principal.role.value, "actor_id": principal.actor_id}


@router.get("/admin/users")
def list_users(
    principal: Principal = Depends(require_roles(Role.admin)),
    auth: AuthService = Depends(get_auth_service),
) -> dict:
    return {"users": auth.list_users()}


@router.post("/admin/users")
def create_user(
    payload: CreateUserRequest,
    principal: Principal = Depends(require_roles(Role.admin)),
    auth: AuthService = Depends(get_auth_service),
) -> dict:
    try:
        user = auth.create_user(payload.username, payload.password, payload.role, payload.actor_id)
        return {"user": user}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
