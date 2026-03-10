from app.services.storage import DataStore


class ProviderBiddingService:
    def __init__(self, store: DataStore) -> None:
        self._bids = store.get_collection("provider_bids")
