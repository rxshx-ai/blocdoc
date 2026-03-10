import os
from web3 import Web3
from eth_account import Account
import json

from backend.app.config.settings import get_settings

settings = get_settings()
w3 = Web3(Web3.HTTPProvider(settings.blockchain_rpc_url))
account = Account.from_key(settings.default_signer_private_key)

from pathlib import Path

abi_path = settings.contract_abi_path or str(Path("app/config/healthcare_logistics_abi.json").resolve())

with open(abi_path) as f:
    abi = json.load(f)

contract = w3.eth.contract(address=Web3.to_checksum_address(settings.contract_address), abi=abi)

provider_role = contract.functions.PROVIDER_ROLE().call()

nonce = w3.eth.get_transaction_count(account.address)
tx = contract.functions.grantRole(provider_role, account.address).build_transaction({
    'from': account.address,
    'nonce': nonce,
    'gasPrice': w3.eth.gas_price
})

try:
    tx['gas'] = int(contract.functions.grantRole(provider_role, account.address).estimate_gas({'from': account.address}) * 1.2)
except Exception:
    tx['gas'] = 800000

signed = w3.eth.account.sign_transaction(tx, account.key)
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)

print("Granted PROVIDER_ROLE to", account.address)
