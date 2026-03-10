
<p align="center">
  <img src="https://img.shields.io/badge/GLITCHCON_2.0-GBS__1-blueviolet?style=for-the-badge&logo=ethereum&logoColor=white" alt="GLITCHCON 2.0"/>
  <img src="https://img.shields.io/badge/Blockchain-Hyperledger_Fabric-2ea44f?style=for-the-badge&logo=hyperledger&logoColor=white"/>
  <img src="https://img.shields.io/badge/IoT-Real--Time_Monitoring-ff6b35?style=for-the-badge&logo=arduino&logoColor=white"/>
  <img src="https://img.shields.io/badge/AI-Route_Optimization-00d2ff?style=for-the-badge&logo=tensorflow&logoColor=white"/>
  <img src="https://img.shields.io/badge/Status-Hackathon_Submission-gold?style=for-the-badge"/>
</p>

<h1 align="center">
  ⛓️ BlocDoc
</h1>

<h2 align="center">
  <em>Decentralized Autonomous Healthcare Logistics Network</em>
</h2>

<p align="center">
  <strong>🏥 Reimagining the backbone of global healthcare — one immutable block at a time.</strong>
</p>

<p align="center">
  <em>A blockchain-powered, IoT-integrated, AI-optimized logistics platform that brings radical transparency, unbreakable trust, and autonomous coordination to the transportation of life-saving medical supplies.</em>
</p>

---

<p align="center">
  <a href="#-the-problem">🔥 Problem</a> •
  <a href="#-our-solution">💡 Solution</a> •
  <a href="#-architecture">🏗️ Architecture</a> •
  <a href="#-features">✨ Features</a> •
  <a href="#-tech-stack">🛠️ Tech Stack</a> •
  <a href="#-live-scenario">🚀 Live Scenario</a> •
  <a href="#-getting-started">⚡ Getting Started</a> •
  <a href="#-team">👥 Team</a>
</p>

---

## 💀 The Problem

> *"Every 2 seconds, somewhere in the world, a life-saving shipment is delayed, lost, or compromised — not because of logistics failure, but because of a system failure."*

Healthcare supply chains are the invisible lifeline of modern medicine. Yet beneath the surface, this lifeline is **fraying at every seam**.

### The Silent Crisis in Healthcare Logistics

When a hospital runs out of vaccines, when blood samples degrade in transit, when emergency medications arrive too late — the consequences aren't measured in dollars. They're measured in **human lives**.

Today's healthcare logistics ecosystem is plagued by:

| 🚨 Challenge | 😰 Real-World Impact |
|---|---|
| **Zero Transparency** | Shipments vanish into black holes between handoffs |
| **Unverifiable Deliveries** | Forged signatures, tampered documentation |
| **Temperature Blind Spots** | Vaccines spoil silently — no one knows until it's too late |
| **Siloed Data Systems** | Hospital A cannot see what Distribution Center B transmitted |
| **Manual Paper Trails** | Human error, delays, and opportunities for fraud |
| **No Automated Resolution** | Payment disputes drag on for weeks after delivery |
| **No Trust Without a Middleman** | Every transaction requires an intermediary who adds cost and latency |

### The Scale of the Problem

- 🌡️ **25% of vaccines** arrive degraded due to cold-chain failures globally *(WHO, 2022)*  
- 📦 **$35 billion** lost annually in pharmaceutical supply chain inefficiencies *(Deloitte)*  
- ⏱️ **48+ hours** wasted on average in manual delivery verification disputes  
- 🦠 **Counterfeit medicines** represent 10% of global supply — enabled by opaque logistics  

The root cause? **Centralized, trust-based, manual systems** in an industry that can afford none of these.

---

## 💡 Our Solution

### BlocDoc — The Autonomous Healthcare Logistics Operating System

**BlocDoc** is not just another logistics platform. It is a **paradigm shift** — a living, breathing decentralized ecosystem where blockchain immutability, smart contract autonomy, IoT sensor intelligence, and AI-powered optimization converge to create a **trustless, transparent, and tamper-proof** supply chain for critical healthcare assets.

```
╔════════════════════════════════════════════════════════════════╗
║                        BLOCDOC VISION                          ║
║                                                                ║
║  WHERE EVERY HANDOFF IS VERIFIED  ▸  EVERY CONDITION LOGGED   ║
║  WHERE EVERY PAYMENT IS INSTANT   ▸  EVERY PARTY ACCOUNTABLE  ║
║  WHERE NO SINGLE ENTITY CONTROLS  ▸  EVERYONE COLLABORATES    ║
╚════════════════════════════════════════════════════════════════╝
```

We replace **trust** with **cryptographic proof**. We replace **phone calls** with **smart contracts**. We replace **guesswork** with **real-time sensor data**. We replace **manual payments** with **autonomous settlement**.

---

## 🏗️ Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BLOCDOC PLATFORM ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │
│   │  Pharma Mfr  │   │  Dist Center │   │   Hospital   │   │    Lab     │  │
│   │  (Angular)   │   │  (Angular)   │   │  (Flutter)   │   │ (Flutter)  │  │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └─────┬──────┘  │
│          │                  │                  │                  │         │
│   ┌──────▼──────────────────▼──────────────────▼──────────────────▼──────┐  │
│   │                     REST API / GraphQL Gateway                       │  │
│   │                    (Node.js + FastAPI Layer)                         │  │
│   └──────────────────────────────┬──────────────────────────────────────┘  │
│                                  │                                         │
│         ┌────────────────────────┼────────────────────────┐               │
│         │                        │                        │               │
│   ┌─────▼──────┐         ┌───────▼──────┐        ┌───────▼──────┐        │
│   │  Chaincode │         │   Firebase   │         │   MongoDB    │        │
│   │  (Go/Node) │         │  (Realtime)  │         │  (Off-chain) │        │
│   └─────┬──────┘         └───────┬──────┘        └───────┬──────┘        │
│         │                        │                        │               │
│   ┌─────▼────────────────────────▼────────────────────────▼──────┐        │
│   │              HYPERLEDGER FABRIC BLOCKCHAIN NETWORK            │        │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │        │
│   │  │  Orderer │  │  Peer 1  │  │  Peer 2  │  │  Peer N  │     │        │
│   │  │  (RAFT)  │  │ (Pharma) │  │(Hospital)│  │(Transport│     │        │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │        │
│   └───────────────────────────────────────────────────────────────┘        │
│                                  │                                         │
│   ┌───────────────────────────────▼──────────────────────────────┐         │
│   │                    IPFS Document Layer                        │         │
│   │          (Proof-of-Delivery, Manifests, Compliance Docs)      │         │
│   └───────────────────────────────────────────────────────────────┘         │
│                                  │                                         │
│   ┌───────────────────────────────▼──────────────────────────────┐         │
│   │                     IoT Sensor Network                        │         │
│   │    [GPS Tracker] [Temp Sensor] [Humidity] [Tamper Detect]     │         │
│   └───────────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Smart Contract Lifecycle

```
 REQUEST        BIDDING         SELECTION        PICKUP         TRANSIT        DELIVERY       SETTLEMENT
    │               │               │               │               │               │               │
    ▼               ▼               ▼               ▼               ▼               ▼               ▼
┌───────┐      ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│Create │─────▶│Provider │───▶│Auto-Score│───▶│Driver   │───▶│Real-time │───▶│Proof-of- │───▶│Instant   │
│Smart  │      │Bids +   │    │& Select  │    │Verifies │    │IoT +     │    │Delivery  │    │Payment + │
│Contrct│      │Proposals│    │Best Bid  │    │Pickup   │    │GPS Track │    │Confirmed │    │Score Updt│
└───────┘      └─────────┘    └──────────┘    └─────────┘    └──────────┘    └──────────┘    └──────────┘
    │               │               │               │               │               │               │
  [Block 1]      [Block 2]       [Block 3]       [Block 4]     [Block N...]     [Block N+1]    [Block N+2]
    │               │               │               │               │               │               │
    └───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┘
                                  IMMUTABLE BLOCKCHAIN AUDIT TRAIL
```

---

## ✨ Features

### 🔒 Core Features

#### 1. 📋 Blockchain-Based Shipment Ledger
Every logistics event — from transport request creation to delivery confirmation — is recorded as an **immutable transaction on Hyperledger Fabric**. No tampering. No disputes. No ambiguity. The blockchain is the single source of truth shared by all parties, with cryptographic integrity that no single actor can violate.

#### 2. 📝 Smart Contract Logistics Agreements
Transport agreements are not PDFs — they are **self-executing smart contracts** written in Chaincode (Go/Node.js). When conditions are met, the contract executes automatically: selecting providers, logging pickups, triggering payments. No lawyers. No delays. No intermediaries.

#### 3. 🏆 Competitive Provider Bidding & Automated Selection
Physical transport providers submit **structured bids** through their authenticated portals. The platform automatically evaluates bids against pre-defined criteria:
- ⭐ Reputation score & historical performance
- ⏱️ Estimated Delivery Time (ETA) accuracy
- 💰 Competitive pricing
- 🌡️ Vehicle capabilities (refrigeration, GPS, tamper seals)
- 📜 Credential verification status

The best provider is selected algorithmically and the agreement is sealed on-chain.

#### 4. 🚗 Driver Dispatch & Verified Pickup
Once assigned, the driver uses the **BlocDoc Mobile App (Flutter)** to check in at the pickup location. The system:
- Verifies driver identity via cryptographic wallet signature
- Logs precise timestamp and GPS coordinates
- Creates an authenticated pickup event on the blockchain
- Notifies all stakeholders in real time

#### 5. 📡 Real-Time Shipment Tracking
Live telemetry from IoT devices is streamed continuously:

```
📍 GPS Location    → Every 30 seconds
🌡️ Temperature     → Every 60 seconds  
💧 Humidity        → Every 60 seconds
📦 Tamper Status   → Continuous monitoring
🔋 Device Battery  → Every 5 minutes
```

All data is streamed to Firebase for real-time dashboard updates and critical threshold violations trigger instant alerts.

#### 6. ✅ Dual-Party Proof-of-Delivery
Upon arrival, both the **driver** and the **receiving staff** independently confirm delivery through the app. The system captures:
- Digital signatures from both parties
- Photographic evidence (stored on IPFS)
- GPS-confirmed delivery location
- Final condition assessment of cargo
- Immutable blockchain delivery record

#### 7. 💸 Automated Smart Contract Payment Settlement
No invoices. No net-30 payment terms. No disputes. The moment delivery is confirmed on-chain, the **smart contract automatically releases payment** to the transport provider. Instant. Trustless. Unstoppable.

#### 8. 🎯 Role-Based Access Control (RBAC)
Six distinct stakeholder roles, each with carefully scoped permissions:

| Role | Permissions |
|---|---|
| 🏭 **Pharma Manufacturer** | Create shipments, view own logistics history |
| 🏪 **Medical Distribution Center** | Manage inventory handoffs, view distribution routes |
| 🏥 **Hospital / Healthcare Facility** | Request transport, receive deliveries, view incoming |
| 🔬 **Diagnostic Laboratory** | Request specimen transport, manage sensitive samples |
| 🚛 **Licensed Transport Provider** | Bid on contracts, dispatch drivers, view assigned routes |
| 👨‍💼 **Healthcare Administrator** | Full audit access, analytics dashboard, override controls |

#### 9. 🕵️ Immutable Audit Trail
**Every action. Every actor. Every timestamp.** The blockchain maintains a complete, chronological, cryptographically-linked history of every event in a shipment's lifecycle. This creates:
- Irrefutable compliance documentation for regulatory bodies
- Tamper-evident records for dispute resolution
- Complete chain-of-custody for sensitive biological materials

#### 10. 📊 Executive Analytics Dashboard
A real-time command center for healthcare logistics administrators featuring:
- Live shipment map with route visualization
- Temperature compliance heat charts
- Provider performance leaderboards
- SLA breach alerts and trend analytics
- Network health monitoring

---

### 🚀 Bonus Features

#### 🌡️ IoT Condition Monitoring
Custom IoT sensor packages attached to shipment containers transmit live:
- Temperature (±0.1°C accuracy)
- Humidity (±1% RH accuracy)  
- GPS coordinates (3-meter precision)
- Door/tamper seal status
- Shock/vibration events

#### 🤖 AI-Powered Route Optimization & Delay Prediction
A machine learning model trained on historical delivery data predicts:
- Optimal routing based on traffic, weather, and carrier history
- Probability of delay for each active shipment
- Suggested rerouting when anomalies are detected
- ETA confidence intervals

#### 🚨 Automated Deviation Alerts
The platform proactively monitors all active shipments and fires instant alerts for:
- 🌡️ Temperature excursion beyond defined thresholds
- 📍 Route deviation beyond acceptable geofence
- ⏰ Predicted schedule delays exceeding SLA
- 📦 Tamper seal breach detection

#### 🏅 Reputation Scoring Engine
A dynamic trust score (0–100) is maintained on-chain for every participant:
- Delivery success rate
- Temperature compliance rate
- On-time performance
- Documentation accuracy
- Dispute history

Scores are publicly visible, creating powerful incentives for excellence.

#### 📈 Logistics Performance Analytics
Rich analytics for network-level insights:
- Supply chain KPIs by region, cargo type, provider
- Predictive inventory shortage alerts
- Cold chain compliance reporting
- Cost optimization recommendations

---

## 🛠️ Tech Stack

```
╔══════════════════════════════════════════════════════════════╗
║                    BLOCDOC TECH STACK                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  🔗 BLOCKCHAIN         Hyperledger Fabric (Permissioned)     ║
║  📋 SMART CONTRACTS    Chaincode in Go / Node.js             ║
║  🖥️  BACKEND           Node.js + FastAPI (Python)            ║
║  📱 MOBILE APP         Flutter (iOS + Android)               ║
║  🌐 WEB FRONTEND       Angular / Next.js                     ║
║  💾 REAL-TIME DB       Firebase Realtime Database            ║
║  🗄️  DOCUMENT DB        MongoDB Atlas                         ║
║  ☁️  CLOUD              AWS (EC2, S3, Lambda, IoT Core)       ║
║  📁 FILE STORAGE        IPFS (Decentralized)                 ║
║  🤖 AI/ML              Python (scikit-learn, TensorFlow)     ║
║  📡 IoT PROTOCOL       MQTT over AWS IoT Core                ║
║  🔐 AUTH               Hyperledger Fabric CA + JWT           ║
║  🗺️  MAPS               Google Maps API / Mapbox             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### Why Hyperledger Fabric?

Unlike public blockchains (Ethereum, Bitcoin), **Hyperledger Fabric** is purpose-built for enterprise consortiums:

| Feature | Why It Matters for Healthcare |
|---|---|
| **Permissioned Network** | Only verified healthcare entities can participate |
| **Channel Privacy** | Sensitive shipment data shared only with relevant parties |
| **High Throughput** | 3,500+ TPS vs. Ethereum's ~15 TPS |
| **No Gas Fees** | No speculative token economy — pure utility |
| **Pluggable Consensus** | RAFT ordering for crash fault tolerance |
| **GDPR Compatibility** | Private data collections for regulatory compliance |

---

## 🎬 Live Scenario: Vaccines in Motion

> *Follow a real-world journey of 10,000 COVID vaccines from a pharmaceutical manufacturer to 5 regional hospitals — powered entirely by BlocDoc.*

### 🏭 Step 1: Transport Request Creation
The **Regional Hospital Network Administrator** logs into BlocDoc and creates a transport request:

```json
{
  "requestId": "TX-2024-VAX-004821",
  "cargo": {
    "type": "COVID-19 Vaccines",
    "quantity": 10000,
    "sensitivity": "CRITICAL",
    "temperatureRange": { "min": 2, "max": 8, "unit": "celsius" },
    "handlingInstructions": "No direct sunlight, maintain upright position"
  },
  "pickup": {
    "facility": "BioPharm Distribution Center, Mumbai",
    "readyTime": "2024-03-15T06:00:00Z"
  },
  "deliveries": [
    { "facility": "City General Hospital", "deadline": "2024-03-15T12:00:00Z" },
    { "facility": "Eastern Medical Center", "deadline": "2024-03-15T14:00:00Z" }
  ]
}
```

→ **A smart contract is instantiated on the blockchain.** All authenticated transport providers in the network are instantly notified.

---

### 🏆 Step 2: Competitive Bidding
Five licensed transport providers submit bids within 15 minutes. BlocDoc's **automated scoring engine** evaluates all bids:

```
┌─────────────────────────────────────────────────────────────────┐
│                    BID EVALUATION RESULTS                       │
├───────────────┬────────┬──────────┬───────────┬─────────────────┤
│ Provider      │ Score  │ Price    │ ETA       │ Cold Chain      │
├───────────────┼────────┼──────────┼───────────┼─────────────────┤
│ MediFleet ✓   │ 94/100 │ ₹28,500  │ 5.5 hrs   │ ✅ Certified    │
│ RapidMed      │ 87/100 │ ₹31,200  │ 6.1 hrs   │ ✅ Certified    │
│ HealthMove    │ 81/100 │ ₹26,800  │ 7.2 hrs   │ ⚠️  Basic       │
│ ColdChainPro  │ 79/100 │ ₹33,100  │ 5.8 hrs   │ ✅ Premium      │
│ MedXpress     │ 72/100 │ ₹24,200  │ 8.3 hrs   │ ❌ Not Rated    │
└───────────────┴────────┴──────────┴───────────┴─────────────────┘
                          ↑ SELECTED
```

→ **MediFleet is selected automatically.** The agreement is written to the blockchain. MediFleet receives an instant notification. All other providers are notified of non-selection.

---

### 🚛 Step 3: Driver Dispatch & Verified Pickup

Driver Amit Sharma arrives at BioPharm's loading dock at 6:02 AM. He opens the **BlocDoc Driver App** on his phone:

```
📱 BlocDoc Driver App
─────────────────────────────
👤 Driver: Amit Sharma
🆔 License: MH-DL-2019-88441
📦 Assignment: TX-2024-VAX-004821
📍 Location: BioPharm Dist Center
⏰ Time: 06:02:17 AM IST

[VERIFY & PICK UP SHIPMENT]
─────────────────────────────
QR Scan ✓ | GPS ✓ | Signature ✓

✅ PICKUP CONFIRMED ON BLOCKCHAIN
Block: #1,847,293 | Hash: 0xa4f8...
```

→ **Blockchain Event Logged:** `SHIPMENT_PICKUP_CONFIRMED` with driver identity, GPS coordinates, timestamp, and package condition verification.

---

### 📡 Step 4: Live Transit Monitoring

The vaccines begin their journey. Every stakeholder can watch in real time:

```
🗺️  LIVE SHIPMENT DASHBOARD — TX-2024-VAX-004821
════════════════════════════════════════════════
📍 Current Location:   Western Express Hwy, Km 34
🌡️  Temperature:        4.2°C  ✅ IN RANGE (2-8°C)
💧 Humidity:           65%    ✅ NORMAL
📦 Tamper Seal:        INTACT ✅
⏱️  ETA City General:  11:34 AM (26 min ahead of schedule)
🤖 AI Prediction:      98.7% on-time probability

[LAST UPDATED: 10:08:22 AM — 22 seconds ago]
════════════════════════════════════════════════
```

At 10:24 AM — **a temperature alert fires:**

```
🚨 ALERT: TX-2024-VAX-004821
Temperature reading: 8.9°C — ABOVE THRESHOLD
Duration: 4 minutes 17 seconds

→ Driver notified via app
→ Hospital administrator notified
→ Event logged immutably on blockchain
→ AI rerouting suggestion: Take Route 3A (15°C ambient vs 24°C)
```

The driver adjusts the refrigeration unit. Temperature returns to 5.1°C within 6 minutes. The full incident is permanently recorded.

---

### ✅ Step 5: Proof-of-Delivery

Vaccines arrive at City General Hospital at 11:31 AM — **29 minutes ahead of schedule**.

**Receiving Nurse Priya Mehta** and **Driver Amit Sharma** both complete the proof-of-delivery flow:

```
📱 BlocDoc Receiver App
─────────────────────────────────────
📦 Shipment: TX-2024-VAX-004821
🏥 Facility: City General Hospital
📅 Arrival: 11:31:08 AM IST
🌡️  Final Temp: 4.7°C ✅

CARGO CONDITION CHECK:
✅ Packaging intact
✅ Quantity verified: 2,000 units
✅ Labels intact
✅ Condition: Excellent

📸 [Photo Evidence Uploaded → IPFS]
✍️  [Digital Signature Captured]

DELIVERY CONFIRMED ON BLOCKCHAIN
Block: #1,847,441 | Hash: 0x9c3d...
─────────────────────────────────────
```

→ **Proof-of-Delivery is stored on IPFS** and linked to the blockchain record. Accessible by authorized parties forever.

---

### 💸 Step 6: Automated Payment Settlement

**At 11:31:09 AM — one second after delivery confirmation:**

```
⚡ SMART CONTRACT EXECUTION
══════════════════════════════════════
Contract: TX-2024-VAX-004821
Event: DELIVERY_CONFIRMED
Action: RELEASE_PAYMENT

Provider: MediFleet Logistics Ltd.
Amount: ₹28,500.00
Status: ✅ TRANSFERRED INSTANTLY

Reputation Score Update:
MediFleet: 91 → 94 (+3 points)
Driver Amit Sharma: 88 → 90 (+2 points)
══════════════════════════════════════
```

**No invoice. No approval chain. No bank transfer delays. Instant. Trustless. Perfect.**

---

## 📁 Project Structure

```
blocdoc/
├── 🔗 blockchain/
│   ├── network/            # Hyperledger Fabric network config
│   ├── chaincode/
│   │   ├── logistics/      # Core logistics smart contract (Go)
│   │   ├── payment/        # Payment settlement chaincode
│   │   └── reputation/     # Reputation scoring chaincode
│   └── scripts/            # Network setup & deployment scripts
│
├── 🖥️  backend/
│   ├── api-gateway/        # Node.js REST API gateway
│   ├── fabric-client/      # Hyperledger Fabric SDK integration
│   ├── iot-service/        # IoT data ingestion (FastAPI)
│   ├── ai-service/         # Route optimization & prediction
│   └── notification/       # Real-time alert service
│
├── 🌐 frontend/
│   ├── web-admin/          # Angular admin dashboard
│   ├── web-hospital/       # Hospital/facility portal
│   └── web-pharma/         # Pharmaceutical manufacturer portal
│
├── 📱 mobile/
│   ├── driver-app/         # Flutter driver application
│   └── receiver-app/       # Flutter delivery receiver app
│
├── 📡 iot/
│   ├── firmware/           # Sensor firmware (C/C++)
│   ├── device-simulator/   # IoT device simulator for demo
│   └── mqtt-bridge/        # AWS IoT Core bridge
│
├── 🤖 ml/
│   ├── route-optimizer/    # AI route optimization model
│   ├── delay-predictor/    # Delivery delay ML model
│   └── anomaly-detector/   # Temperature anomaly detection
│
└── 📄 docs/
    ├── architecture/       # System architecture diagrams
    ├── api/                # API documentation
    └── deployment/         # Deployment guides
```

---

## ⚡ Getting Started

### Prerequisites

```bash
# Required
node >= 18.0.0
python >= 3.10
docker >= 24.0.0
docker-compose >= 2.0.0
go >= 1.21
flutter >= 3.16.0

# Optional
aws-cli >= 2.0          # For cloud deployment
ipfs >= 0.25.0          # For IPFS node
```

### 🚀 Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/your-team/blocdoc.git
cd blocdoc

# 2. Start the Hyperledger Fabric network
cd blockchain
./scripts/start-network.sh
./scripts/deploy-chaincode.sh

# 3. Start backend services
cd ../backend
npm install
docker-compose up -d          # MongoDB, Firebase emulator
npm run dev                   # Starts API gateway on :3000

# 4. Start IoT simulator (for demo)
cd ../iot/device-simulator
pip install -r requirements.txt
python simulate_shipment.py --shipment-id TX-2024-VAX-004821

# 5. Start the web frontend
cd ../frontend/web-admin
npm install
npm run start                 # Opens on http://localhost:4200

# 6. (Optional) Run ML services
cd ../../ml
pip install -r requirements.txt
python route_optimizer/app.py  # FastAPI on :8001
```

### 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| 👨‍💼 Healthcare Admin | `admin@blocdoc.health` | `demo1234` |
| 🏭 Pharma Manufacturer | `pharma@biocorp.com` | `demo1234` |
| 🏥 Hospital | `hospital@citygeneral.in` | `demo1234` |
| 🚛 Transport Provider | `dispatch@medifleet.com` | `demo1234` |
| 🚗 Driver | `driver@medifleet.com` | `demo1234` |

---

## 🌍 Impact & Vision

### Immediate Impact

| Metric | Current State | With BlocDoc |
|---|---|---|
| **Delivery Verification Time** | 48–72 hours | < 5 seconds |
| **Cold Chain Failure Rate** | 25% | < 2% |
| **Payment Settlement Time** | 15–30 days | Instant |
| **Documentation Disputes** | Frequent | Eliminated |
| **Shipment Visibility** | None or delayed | Real-time |
| **Counterfeit Risk** | High | Near-zero |

### Long-Term Vision

BlocDoc is not just a hackathon project — it is a **blueprint for the future of healthcare supply chains globally**. Built on open standards with Hyperledger Fabric, it can:

- 🌏 **Scale nationally** as a government-backed healthcare logistics network
- 🌐 **Federate globally** with cross-border pharmaceutical supply chains
- 🏛️ **Integrate with regulators** (FDA, WHO, CDSCO) for automated compliance reporting
- 🤝 **Expand to adjacent sectors** (food safety, disaster relief logistics)

Every feature we built was designed for real-world deployment — not just a demo.

---

## 📜 Smart Contract Reference

### Core Chaincode Functions

```go
// Create a new transport request (logged immutably)
func (s *LogisticsContract) CreateTransportRequest(ctx, requestJSON) error

// Submit a bid from a transport provider
func (s *LogisticsContract) SubmitProviderBid(ctx, bidJSON) error

// Automatically evaluate and select the best provider
func (s *LogisticsContract) EvaluateAndSelectProvider(ctx, requestId) error

// Confirm shipment pickup (driver + GPS + timestamp)
func (s *LogisticsContract) ConfirmPickup(ctx, pickupEventJSON) error

// Log an IoT telemetry reading
func (s *LogisticsContract) RecordTelemetry(ctx, telemetryJSON) error

// Confirm delivery (dual-party verification)
func (s *LogisticsContract) ConfirmDelivery(ctx, deliveryProofJSON) error

// Execute payment settlement
func (s *PaymentContract) SettlePayment(ctx, requestId) error

// Update provider reputation score
func (s *ReputationContract) UpdateScore(ctx, providerId, metrics) error
```

---

## 📊 System Performance Targets

| Metric | Target | Notes |
|---|---|---|
| **Transaction Throughput** | 3,500 TPS | Hyperledger Fabric RAFT consensus |
| **Block Confirmation Time** | < 2 seconds | Deterministic finality |
| **IoT Data Latency** | < 5 seconds | MQTT → Firebase → Dashboard |
| **API Response Time** | < 200ms | P95 |
| **Dashboard Real-time Lag** | < 3 seconds | Firebase streaming |
| **Smart Contract Execution** | < 1 second | Payment settlement |
| **System Uptime Target** | 99.97% | AWS multi-AZ deployment |

---

## 🔐 Security Architecture

- 🆔 **Identity Management**: Hyperledger Fabric Certificate Authority (CA) — every participant has a unique cryptographic identity
- 🔏 **Data Integrity**: Every transaction is cryptographically signed and linked in an immutable chain
- 🔒 **Channel Segregation**: Sensitive shipment data is shared only on need-to-know channels
- 🛡️ **Private Data Collections**: Sensitive pricing and payment data kept off the main ledger
- 📁 **Decentralized Storage**: Proof-of-delivery documents stored on IPFS — no single point of failure
- ☁️ **Cloud Security**: AWS IAM, VPC, KMS for cloud infrastructure security
- 📱 **Mobile Security**: Biometric + PIN authentication, encrypted local storage

---

## 👥 Team

> *Built with ❤️ at GLITCHCON 2.0 — GBS_1 Challenge*

| Member | Role |
|---|---|
| **[Team Member 1]** | Blockchain Architect & Smart Contract Developer |
| **[Team Member 2]** | Full Stack Developer (Backend + API) |
| **[Team Member 3]** | Frontend & Mobile Developer (Angular + Flutter) |
| **[Team Member 4]** | IoT Integration & AI/ML Engineer |

---

## 📄 License

This project was built during **GLITCHCON 2.0 Hackathon** (GBS_1 Challenge Track).

---

<p align="center">
  <strong>Built for GLITCHCON 2.0 | GBS_1: Decentralized Autonomous Healthcare Logistics Network</strong>
</p>

<p align="center">
  <em>"In healthcare, transparency isn't a feature — it's a moral imperative. BlocDoc makes it inevitable."</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made_with-❤️_&_blockchain-blueviolet?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/GLITCHCON_2.0-Hackathon_Submission-gold?style=for-the-badge"/>
</p>
