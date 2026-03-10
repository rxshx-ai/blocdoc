# Decentralized Healthcare Logistics Platform

Monorepo skeleton for a decentralized healthcare logistics system.

## Modules

- `backend/`: FastAPI API layer and orchestration services
- `contracts/`: PoA / EVM smart contracts (Solidity)
- `ai/`: Graph Neural Network provider selection components
- `iot_simulator/`: IoT telemetry simulation engine
- `federated_learning/`: Federated model training framework
- `dashboard/`: Frontend/admin dashboard

## Current State

This repository currently contains project scaffolding only.
Operational data in backend services is designed around in-memory storage abstractions that can later be swapped for MongoDB adapters without changing business logic.
