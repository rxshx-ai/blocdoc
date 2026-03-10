from typing import Any, Protocol


class DataStore(Protocol):
    """Persistence abstraction to keep business logic storage-agnostic."""

    def get_collection(self, name: str) -> list[dict[str, Any]]:
        ...

    def get_map_collection(self, name: str) -> dict[str, Any]:
        ...


class InMemoryDataStore:
    """Default local store. Replace with MongoDataStore later without changing services."""

    def __init__(self) -> None:
        self._collections: dict[str, list[dict[str, Any]]] = {}
        self._map_collections: dict[str, dict[str, Any]] = {}

    def get_collection(self, name: str) -> list[dict[str, Any]]:
        if name not in self._collections:
            self._collections[name] = []
        return self._collections[name]

    def get_map_collection(self, name: str) -> dict[str, Any]:
        if name not in self._map_collections:
            self._map_collections[name] = {}
        return self._map_collections[name]
