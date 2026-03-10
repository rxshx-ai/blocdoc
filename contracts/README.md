# Contracts

Hardhat workspace for Polygon-compatible healthcare logistics smart contracts.

## Contract

- `contracts/HealthcareLogistics.sol`

Implemented lifecycle functions:

- `createShipment`
- `submitBid`
- `selectProvider`
- `verifyPickup`
- `confirmDelivery`
- `logTelemetryHash`
- `releasePayment`

Shipment status enum:

- `CREATED`
- `BIDDING`
- `PROVIDER_SELECTED`
- `IN_TRANSIT`
- `DELIVERED`

Role-based access control (OpenZeppelin `AccessControl`):

- `SHIPMENT_MANAGER_ROLE`
- `PROVIDER_ROLE`
- `TELEMETRY_ROLE`
- `DEFAULT_ADMIN_ROLE`

## Development

```bash
cd contracts
npm install
npm run build
```

## Deployment

```bash
cd contracts
cp .env.example .env
# set POLYGON_AMOY_RPC_URL and DEPLOYER_PRIVATE_KEY
npm run deploy:polygon-amoy
```

For a PoA network deployment:

```bash
cd contracts
cp .env.example .env
# set POA_RPC_URL, POA_CHAIN_ID, and DEPLOYER_PRIVATE_KEY
npm run deploy:poa
```

For local node deployment:

```bash
npm run deploy:localhost
```
