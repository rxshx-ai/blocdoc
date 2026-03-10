from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_FILE_PATH = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    app_name: str = "Healthcare Logistics API"
    app_version: str = "0.1.0"

    # Storage backend can later switch to "mongodb" while keeping service APIs unchanged.
    data_store_backend: str = "in_memory"
    mongodb_uri: str = "mongodb://127.0.0.1:27017/"

    # Local Hardhat defaults for blockchain integration.
    blockchain_rpc_url: str = "http://127.0.0.1:8545"
    blockchain_chain_id: int = 31337
    blockchain_poa_enabled: bool = False
    contract_address: str = ""
    default_signer_private_key: str = ""
    contract_abi_path: str = ""
    ipfs_api_url: str = "http://127.0.0.1:5001"

    telemetry_time_window_seconds: int = 120
    telemetry_temperature_min_c: float = -40.0
    telemetry_temperature_max_c: float = 85.0
    telemetry_max_speed_mps: float = 70.0
    telemetry_batch_interval_seconds: int = 180

    model_config = SettingsConfigDict(env_file=ENV_FILE_PATH, env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
