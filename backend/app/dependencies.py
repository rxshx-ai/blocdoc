from functools import lru_cache

from app.config.settings import get_settings
from app.services.ai_provider_selection_service import AIProviderSelectionService
from app.services.analytics_service import AnalyticsService
from app.services.auth_service import AuthService
from app.services.blockchain_service import BlockchainService
from app.services.ipfs_service import IPFSService
from app.services.logistics_service import LogisticsService
from app.services.notification_service import NotificationService
from app.services.telemetry_service import TelemetryService
from app.services.storage import DataStore, InMemoryDataStore
from app.services.mongo_storage import MongoDataStore


@lru_cache
def get_store() -> DataStore:
    settings = get_settings()
    if settings.data_store_backend == "mongodb":
        return MongoDataStore()
    return InMemoryDataStore()


@lru_cache
def get_blockchain_service() -> BlockchainService:
    return BlockchainService(get_settings())


@lru_cache
def get_logistics_service() -> LogisticsService:
    store = get_store()
    return LogisticsService(store, get_blockchain_service())


@lru_cache
def get_telemetry_service() -> TelemetryService:
    return TelemetryService(get_store(), get_blockchain_service(), get_settings())


@lru_cache
def get_ai_provider_selection_service() -> AIProviderSelectionService:
    return AIProviderSelectionService()


@lru_cache
def get_ipfs_service() -> IPFSService:
    return IPFSService(get_store(), get_blockchain_service(), get_settings())


@lru_cache
def get_auth_service() -> AuthService:
    return AuthService(get_store())


@lru_cache
def get_analytics_service() -> AnalyticsService:
    return AnalyticsService(get_store())


@lru_cache
def get_notification_service() -> NotificationService:
    return NotificationService()
