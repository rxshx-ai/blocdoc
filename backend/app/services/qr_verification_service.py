from app.services.storage import DataStore


class QRVerificationService:
    def __init__(self, store: DataStore) -> None:
        self._verification_events = store.get_collection("qr_verification_events")
