from __future__ import annotations

from enum import Enum

from fastapi import Header, HTTPException

class Role(str, Enum):
    admin = "admin"
    shipper = "shipper"
    provider = "provider"
    driver = "driver"
    receiver = "receiver"


class Principal:
    def __init__(self, role: Role, actor_id: str | None) -> None:
        self.role = role
        self.actor_id = actor_id


def require_roles(*allowed_roles: Role):
    def dependency(
        authorization: str | None = Header(default=None, alias="Authorization"),
        x_role: str | None = Header(default=None, alias="X-Role"),
        x_actor_id: str | None = Header(default=None, alias="X-Actor-Id"),
    ) -> Principal:
        if authorization and authorization.lower().startswith("bearer "):
            token = authorization.split(" ", 1)[1].strip()
            if token:
                try:
                    from app.dependencies import get_auth_service

                    principal = get_auth_service().resolve_token(token)
                except ValueError as exc:
                    raise HTTPException(status_code=401, detail=str(exc)) from exc

                if allowed_roles and principal.role not in allowed_roles:
                    allowed = ", ".join(r.value for r in allowed_roles)
                    raise HTTPException(
                        status_code=403,
                        detail=f"Role '{principal.role.value}' is not allowed for this action. Allowed: {allowed}",
                    )
                return principal

        if not x_role:
            raise HTTPException(status_code=401, detail="Missing X-Role header")

        try:
            role = Role(x_role.strip().lower())
        except ValueError as exc:
            raise HTTPException(status_code=403, detail="Invalid role") from exc

        if allowed_roles and role not in allowed_roles:
            allowed = ", ".join(r.value for r in allowed_roles)
            raise HTTPException(
                status_code=403,
                detail=f"Role '{role.value}' is not allowed for this action. Allowed: {allowed}",
            )

        actor_id = x_actor_id.strip() if x_actor_id else None
        return Principal(role=role, actor_id=actor_id)

    return dependency
