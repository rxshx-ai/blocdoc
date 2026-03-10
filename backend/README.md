# Backend (FastAPI)

## Responsibilities

- Shipment management
- Provider bidding
- QR pickup and delivery verification
- Telemetry ingestion
- Blockchain interaction
- AI provider selection orchestration
- IPFS integration

## Structure

- `app/routes/`: API endpoints
- `app/services/`: Business services and adapters
- `app/models/`: Domain models / schemas
- `app/config/`: Settings and runtime config

## Run

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Blockchain Integration (Hardhat Local Node)

This backend uses `web3.py` to sign and submit transactions to the deployed
`HealthcareLogistics` contract.

Setup:

```bash
cd backend
cp .env.example .env
# fill CONTRACT_ADDRESS and DEFAULT_SIGNER_PRIVATE_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Expected local chain defaults:

- RPC: `http://127.0.0.1:8545`
- Chain ID: `31337`

For a PoA chain (Geth Clique, IBFT, etc.), set in `backend/.env`:

- `BLOCKCHAIN_RPC_URL=<your_poa_rpc_url>`
- `BLOCKCHAIN_CHAIN_ID=<your_poa_chain_id>`
- `BLOCKCHAIN_POA_ENABLED=true`

The backend will inject the PoA middleware automatically when enabled.

## Workflow Endpoints

- `POST /shipment/create`
- `POST /bid`
- `POST /shipment/select_provider`
- `POST /shipment/arrived_pickup`
- `POST /shipment/verify_pickup_qr`
- `POST /shipment/arrived_delivery`
- `POST /shipment/verify_delivery_qr`
- `GET /shipment/{shipment_id}`
- `GET /shipments`
- `GET /shipment/{shipment_id}/bids`

## Role-Based Access Control

Operational endpoints use simple role headers:

- `X-Role`: `admin | shipper | provider | driver | receiver`
- `X-Actor-Id`: optional identity (required for role-scoped provider/driver actions)

Examples:

```bash
curl -H "X-Role: shipper" -H "X-Actor-Id: shipper-001" http://127.0.0.1:8000/shipments
curl -H "X-Role: provider" -H "X-Actor-Id: provider-001" http://127.0.0.1:8000/shipment/SHP-001/bids
```

## Operations UI

Open the built-in role console at:

- `GET /ui`

The UI allows role-based shipment creation, bidding, provider selection, and driver fulfillment flow.

## Login and Admin

Authentication endpoints:

- `POST /auth/login`
- `GET /auth/me`

Admin endpoints:

- `GET /admin/users`
- `POST /admin/users`

Use the UI at `GET /ui` for role-based login and admin user management.

Default seeded users:

- `admin / admin123`
- `shipper / shipper123`
- `provider / provider123`
- `driver / driver123`
- `receiver / receiver123`

## Telemetry Endpoints

- `POST /telemetry/register_device`
- `POST /telemetry/ingest`
- `GET /telemetry/shipment/{shipment_id}`

## AI Endpoint

- `POST /ai/select-provider`

Input:

- `shipment_data`
- `provider_bids`
- `driver_features`

Output:

- `selected_provider`
- `gnn_success_probability`
- `final_score`

## IPFS Endpoints

- `POST /ipfs/upload`
- `GET /ipfs/documents/{shipment_id}`

Supported document types for upload:

- `transport_permit`
- `delivery_receipt`
- `ai_provider_selection_explanation`

Operational data is stored in in-memory Python dictionaries and can be replaced
later behind the storage abstraction.

## End-to-End Workflow Test

Run the lifecycle simulation script:

```bash
cd backend
source .venv/bin/activate
python scripts/test_workflow.py
```

The script saves QR images to `backend/tmp/pickup_qr.png` and `backend/tmp/delivery_qr.png`.
