from app.services.storage import DataStore


class ShipmentService:
    def __init__(self, store: DataStore) -> None:
        self._shipments = store.get_collection("shipments")
