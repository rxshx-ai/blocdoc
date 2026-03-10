import json
from pathlib import Path

from eth_account import Account
from web3 import Web3
from web3.contract import Contract

try:
    from web3.middleware import geth_poa_middleware
except ImportError:  # web3.py compatibility fallback
    from web3.middleware.proof_of_authority import ExtraDataToPOAMiddleware as geth_poa_middleware

from app.config.settings import Settings


class BlockchainService:
    """Web3 adapter for signed interactions with the HealthcareLogistics contract."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._web3 = Web3(Web3.HTTPProvider(settings.blockchain_rpc_url))
        if settings.blockchain_poa_enabled:
            # Required for PoA chains where block extraData is > 32 bytes.
            self._web3.middleware_onion.inject(geth_poa_middleware, layer=0)
        self._contract = self._load_contract()

    def create_shipment(
        self,
        shipment_id: str,
        pickup_location: str,
        delivery_location: str,
        cargo_type: str,
        temperature_requirement: int,
        escrow_amount_wei: int,
        signer_private_key: str | None,
    ) -> str:
        return self._transact(
            self._contract.functions.createShipment(
                shipment_id,
                pickup_location,
                delivery_location,
                cargo_type,
                temperature_requirement,
            ),
            signer_private_key=signer_private_key,
            value=escrow_amount_wei,
        )

    def submit_provider_bid(
        self,
        shipment_id: str,
        price: int,
        estimated_delivery_time: int,
        vehicle_type: str,
        signer_private_key: str | None,
    ) -> str:
        return self._transact(
            self._contract.functions.submitBid(
                shipment_id,
                price,
                estimated_delivery_time,
                vehicle_type,
            ),
            signer_private_key=signer_private_key,
        )

    def record_provider_selection(
        self,
        shipment_id: str,
        provider_address: str,
        signer_private_key: str | None,
    ) -> str:
        return self._transact(
            self._contract.functions.selectProvider(
                shipment_id,
                Web3.to_checksum_address(provider_address),
            ),
            signer_private_key=signer_private_key,
        )

    def record_pickup_verification(self, shipment_id: str, signer_private_key: str | None) -> str:
        return self._transact(
            self._contract.functions.verifyPickup(shipment_id),
            signer_private_key=signer_private_key,
        )

    def record_delivery_confirmation(self, shipment_id: str, signer_private_key: str | None) -> str:
        return self._transact(
            self._contract.functions.confirmDelivery(shipment_id),
            signer_private_key=signer_private_key,
        )

    def log_telemetry_hash(
        self,
        shipment_id: str,
        telemetry_hash: str,
        signer_private_key: str | None,
    ) -> str:
        return self._transact(
            self._contract.functions.logTelemetryHash(shipment_id, telemetry_hash),
            signer_private_key=signer_private_key,
        )

    def resolve_signer_address(self, signer_private_key: str | None) -> str:
        account = self._resolve_signer(signer_private_key)
        return account.address

    def _transact(self, contract_function, signer_private_key: str | None, value: int = 0) -> str:
        account = self._resolve_signer(signer_private_key)
        nonce = self._web3.eth.get_transaction_count(account.address, "pending")

        tx_params = {
            "from": account.address,
            "nonce": nonce,
            "chainId": self._settings.blockchain_chain_id,
            "gasPrice": self._web3.eth.gas_price,
            "value": value,
        }

        try:
            estimated = contract_function.estimate_gas({"from": account.address, "value": value})
            tx_params["gas"] = int(estimated * 1.2)
        except Exception:
            tx_params["gas"] = 800000

        unsigned_tx = contract_function.build_transaction(tx_params)
        signed_tx = self._web3.eth.account.sign_transaction(unsigned_tx, account.key)
        tx_hash = self._web3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = self._web3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt.status != 1:
            raise ValueError("Blockchain transaction reverted")
        return tx_hash.hex()

    def _resolve_signer(self, signer_private_key: str | None):
        private_key = signer_private_key or self._settings.default_signer_private_key
        if not private_key:
            raise ValueError("No signer private key provided")
        normalized = private_key if private_key.startswith("0x") else f"0x{private_key}"
        return Account.from_key(normalized)

    def _load_contract(self) -> Contract:
        if not self._settings.contract_address:
            raise ValueError("contract_address is not configured")

        abi_path = self._settings.contract_abi_path.strip()
        if abi_path:
            path = Path(abi_path)
        else:
            path = Path(__file__).resolve().parents[1] / "config" / "healthcare_logistics_abi.json"

        with path.open("r", encoding="utf-8") as file:
            abi = json.load(file)

        return self._web3.eth.contract(
            address=Web3.to_checksum_address(self._settings.contract_address),
            abi=abi,
        )
