from __future__ import annotations

import secrets
from typing import Any

from app.security.rbac import Principal, Role
from app.services.storage import DataStore


class AuthService:
    def __init__(self, store: DataStore) -> None:
        self._users: dict[str, dict[str, Any]] = store.get_map_collection("auth_users")
        self._sessions: dict[str, dict[str, Any]] = store.get_map_collection("auth_sessions")
        self._seed_defaults()

    def _seed_defaults(self) -> None:
        defaults = [
            {"username": "admin", "password": "admin123", "role": Role.admin.value, "actor_id": "admin-001"},
            {"username": "shipper", "password": "shipper123", "role": Role.shipper.value, "actor_id": "shipper-001"},
            {"username": "hospital", "password": "hospital123", "role": Role.shipper.value, "actor_id": "hospital-001"},
            {"username": "lab", "password": "lab123", "role": Role.shipper.value, "actor_id": "lab-001"},
            {"username": "provider", "password": "provider123", "role": Role.provider.value, "actor_id": "provider-001"},
            {"username": "partner", "password": "partner123", "role": Role.provider.value, "actor_id": "partner-001"},
            {"username": "driver", "password": "driver123", "role": Role.driver.value, "actor_id": "driver-001"},
            {"username": "receiver", "password": "receiver123", "role": Role.receiver.value, "actor_id": "receiver-001"},
            {"username": "clinic", "password": "clinic123", "role": Role.receiver.value, "actor_id": "clinic-001"},
        ]
        for user in defaults:
            self._users.setdefault(user["username"], user)

    def login(self, username: str, password: str) -> dict[str, Any]:
        user = self._users.get(username)
        if not user or user.get("password") != password:
            raise ValueError("Invalid credentials")

        token = secrets.token_urlsafe(24)
        session = {
            "username": user["username"],
            "role": user["role"],
            "actor_id": user.get("actor_id"),
        }
        self._sessions[token] = session
        return {"access_token": token, "token_type": "bearer", **session}

    def resolve_token(self, token: str) -> Principal:
        session = self._sessions.get(token)
        if not session:
            raise ValueError("Invalid or expired token")
        return Principal(role=Role(session["role"]), actor_id=session.get("actor_id"))

    def list_users(self) -> list[dict[str, Any]]:
        return [
            {
                "username": user["username"],
                "role": user["role"],
                "actor_id": user.get("actor_id"),
            }
            for user in self._users.values()
        ]

    def create_user(self, username: str, password: str, role: str, actor_id: str | None = None) -> dict[str, Any]:
        if username in self._users:
            raise ValueError("Username already exists")

        try:
            normalized_role = Role(role.lower()).value
        except ValueError as exc:
            raise ValueError("Invalid role") from exc

        if not password:
            raise ValueError("Password cannot be empty")

        user = {
            "username": username,
            "password": password,
            "role": normalized_role,
            "actor_id": actor_id,
        }
        self._users[username] = user
        return {
            "username": username,
            "role": normalized_role,
            "actor_id": actor_id,
        }
