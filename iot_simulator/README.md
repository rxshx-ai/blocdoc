# IoT Simulator

Async telemetry simulator for shipment container IoT devices.

## Simulated Sensors

- temperature
- humidity
- GPS location

## Telemetry Packet Structure

- `device_id`
- `shipment_id`
- `sequence_number`
- `temperature`
- `humidity`
- `latitude`
- `longitude`
- `timestamp`
- `digital_signature`

Each device creates its own Ed25519 key pair. Every packet is signed with the
device private key.

## Features

- Realistic movement between pickup and delivery coordinates
- Packet transmission every few seconds (configurable)
- Multiple devices running simultaneously with `asyncio`
- Optional HTTP forwarding to an ingestion endpoint

## Run

```bash
cd iot_simulator
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run_simulation.py --devices 5 --interval 2 --duration 30
```

Forward packets to an API endpoint:

```bash
python run_simulation.py --devices 5 --interval 2 --duration 30 --endpoint http://127.0.0.1:8000/telemetry/ingest
```

Register device public keys and then ingest signed packets:

```bash
python run_simulation.py \
	--devices 5 \
	--interval 2 \
	--duration 30 \
	--register-endpoint http://127.0.0.1:8000/telemetry/register_device \
	--endpoint http://127.0.0.1:8000/telemetry/ingest
```

Main implementation files:

- `iot_simulator/simulator.py`
- `iot_simulator/run_simulation.py`
