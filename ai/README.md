# AI Dataset + Graph Training

This folder contains a synthetic dataset generator and graph pipeline for training a GNN to estimate:

`P(successful_delivery | provider, driver, shipment)`

## Files

- `generate_synthetic_dataset.py`: Creates CSV tables for providers, drivers, vehicles, hospitals, shipments.
- `graph_dataset.py`: Converts CSV tables into a PyTorch Geometric `Data` graph object.
- `train_graphsage.py`: Minimal GraphSAGE training script for shipment success prediction.
- `requirements.txt`: Python dependencies for this module.

## Dataset Tables

Generated in `ai/data/`:

- `providers.csv`
- `drivers.csv`
- `vehicles.csv`
- `hospitals.csv`
- `shipments.csv`

## Generate Synthetic Data

```bash
cd /Users/rishi/final1
python ai/generate_synthetic_dataset.py --output-dir ai/data --seed 42
```

Default sizes:

- providers: 50
- drivers: 200
- vehicles: 100
- shipments: 500
- hospitals: 30

## Graph Construction

`graph_dataset.load_graph_data("ai/data")` returns a `torch_geometric.data.Data` object with:

- `x`: node features
- `edge_index`: graph connectivity
- `edge_type`: integer type per edge
- `y`: node labels (`delivery_success` for shipment nodes, `-1` otherwise)
- `shipment_mask`: `True` for shipment nodes

Edge type mapping in code:

- `0`: provider handled shipment
- `1`: driver transported shipment
- `2`: provider employs driver
- `3`: provider owns vehicle
- `4`: shipment delivered to hospital

## Train GraphSAGE

```bash
cd /Users/rishi/final1
python ai/train_graphsage.py --data-dir ai/data --epochs 40 --lr 0.01
```

The training script uses shipment nodes only for loss/metrics.
