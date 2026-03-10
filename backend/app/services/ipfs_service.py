import hashlib
import json
from datetime import UTC, datetime
from typing import Any

import requests

from app.config.settings import Settings
from app.models.ipfs_requests import DocumentType
from app.services.blockchain_service import BlockchainService
from app.services.storage import DataStore


class IPFSService:
    def __init__(self, store: DataStore, blockchain: BlockchainService, settings: Settings) -> None:
        self._documents = store.get_collection("ipfs_documents")
        self._documents_by_shipment: dict[str, list[dict[str, Any]]] = store.get_map_collection(
            "ipfs_documents_by_shipment"
        )
        self._blockchain = blockchain
        self._settings = settings

    def upload_document(
        self,
        shipment_id: str,
        document_type: DocumentType,
        filename: str,
        file_bytes: bytes,
        signer_private_key: str | None = None,
    ) -> dict[str, Any]:
        cid = self._add_to_ipfs(filename, file_bytes)
        cid_hash = hashlib.sha256(cid.encode("utf-8")).hexdigest()

        # Reuse contract telemetry hash function to anchor document CID hash by shipment.
        blockchain_tx_hash = self._blockchain.log_telemetry_hash(
            shipment_id=shipment_id,
            telemetry_hash=cid_hash,
            signer_private_key=signer_private_key,
        )

        record = {
            "shipment_id": shipment_id,
            "document_type": document_type.value,
            "filename": filename,
            "cid": cid,
            "cid_hash": cid_hash,
            "blockchain_tx_hash": blockchain_tx_hash,
            "uploaded_at": datetime.now(UTC).isoformat(),
        }

        self._documents.append(record)
        self._documents_by_shipment.setdefault(shipment_id, []).append(record)
        return record

    def list_documents(self, shipment_id: str) -> list[dict[str, Any]]:
        return self._documents_by_shipment.get(shipment_id, [])

    def _add_to_ipfs(self, filename: str, file_bytes: bytes) -> str:
        url = f"{self._settings.ipfs_api_url}/api/v0/add"
        files = {"file": (filename, file_bytes)}

        try:
            response = requests.post(url, files=files, params={"pin": "true"}, timeout=20)
        except requests.RequestException as exc:
            raise ValueError(f"IPFS upload failed: {exc}") from exc

        if response.status_code >= 400:
            raise ValueError(f"IPFS add failed with status {response.status_code}: {response.text}")

        # Kubo may return one or more JSON lines; CID is in the final line.
        line = response.text.strip().splitlines()[-1]
        try:
            payload = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError("Invalid response from IPFS add") from exc

        cid = payload.get("Hash")
        if not cid:
            raise ValueError("IPFS response missing CID hash")
        return str(cid)
