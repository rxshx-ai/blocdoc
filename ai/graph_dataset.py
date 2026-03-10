from __future__ import annotations

import csv
import math
from pathlib import Path
from typing import Any

import torch
from torch_geometric.data import Data


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _to_float(value: str) -> float:
    return float(value)


def _cargo_one_hot(cargo_type: str) -> list[float]:
    classes = ["vaccines", "blood", "diagnostic_kits", "medicines", "organs"]
    return [1.0 if cargo_type == c else 0.0 for c in classes]


def _vehicle_type_one_hot(vehicle_type: str) -> list[float]:
    classes = ["van", "truck", "reefer_truck"]
    return [1.0 if vehicle_type == c else 0.0 for c in classes]


def _refrigeration_one_hot(refrigeration_type: str) -> list[float]:
    classes = ["none", "passive", "active", "ultra_low"]
    return [1.0 if refrigeration_type == c else 0.0 for c in classes]


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return radius_km * 2 * math.asin(math.sqrt(a))


def _pad(features: list[float], dim: int) -> list[float]:
    if len(features) >= dim:
        return features[:dim]
    return features + [0.0] * (dim - len(features))


def load_graph_data(data_dir: str | Path) -> Data:
    data_path = Path(data_dir)

    providers = _read_csv(data_path / "providers.csv")
    drivers = _read_csv(data_path / "drivers.csv")
    vehicles = _read_csv(data_path / "vehicles.csv")
    hospitals = _read_csv(data_path / "hospitals.csv")
    shipments = _read_csv(data_path / "shipments.csv")

    feature_dim = 20

    x_rows: list[list[float]] = []
    y_rows: list[float] = []
    shipment_mask: list[bool] = []

    provider_idx: dict[str, int] = {}
    driver_idx: dict[str, int] = {}
    vehicle_idx: dict[str, int] = {}
    hospital_idx: dict[str, int] = {}
    shipment_idx: dict[str, int] = {}

    for p in providers:
        idx = len(x_rows)
        provider_idx[p["provider_id"]] = idx
        features = [
            1, 0, 0, 0, 0,
            _to_float(p["success_rate"]),
            _to_float(p["cold_chain_compliance_score"]),
            _to_float(p["average_delivery_delay"]) / 10.0,
            _to_float(p["fleet_size"]) / 150.0,
            _to_float(p["refrigeration_capability_score"]),
        ]
        x_rows.append(_pad(features, feature_dim))
        y_rows.append(-1.0)
        shipment_mask.append(False)

    for d in drivers:
        idx = len(x_rows)
        driver_idx[d["driver_id"]] = idx
        features = [
            0, 1, 0, 0, 0,
            _to_float(d["years_experience"]) / 30.0,
            _to_float(d["on_time_delivery_rate"]),
            _to_float(d["route_deviation_rate"]),
        ]
        x_rows.append(_pad(features, feature_dim))
        y_rows.append(-1.0)
        shipment_mask.append(False)

    for v in vehicles:
        idx = len(x_rows)
        vehicle_idx[v["vehicle_id"]] = idx
        features = [0, 0, 1, 0, 0]
        features.extend(_vehicle_type_one_hot(v["vehicle_type"]))
        features.extend(_refrigeration_one_hot(v["refrigeration_type"]))
        features.append(_to_float(v["maintenance_score"]))
        x_rows.append(_pad(features, feature_dim))
        y_rows.append(-1.0)
        shipment_mask.append(False)

    for h in hospitals:
        idx = len(x_rows)
        hospital_idx[h["hospital_id"]] = idx
        features = [
            0, 0, 0, 0, 1,
            _to_float(h["location_lat"]) / 90.0,
            _to_float(h["location_lon"]) / 180.0,
            _to_float(h["capacity"]) / 1500.0,
        ]
        x_rows.append(_pad(features, feature_dim))
        y_rows.append(-1.0)
        shipment_mask.append(False)

    for s in shipments:
        idx = len(x_rows)
        shipment_idx[s["shipment_id"]] = idx
        features = [
            0, 0, 0, 1, 0,
            _to_float(s["pickup_lat"]) / 90.0,
            _to_float(s["pickup_lon"]) / 180.0,
            _to_float(s["delivery_lat"]) / 90.0,
            _to_float(s["delivery_lon"]) / 180.0,
            _to_float(s["temperature_requirement"]) / 100.0,
            _to_float(s["distance_km"]) / 300.0,
        ]
        features.extend(_cargo_one_hot(s["cargo_type"]))
        x_rows.append(_pad(features, feature_dim))
        y_rows.append(float(s["delivery_success"]))
        shipment_mask.append(True)

    edge_src: list[int] = []
    edge_dst: list[int] = []
    edge_type: list[int] = []

    edge_type_map = {
        "provider_handled_shipment": 0,
        "driver_transported_shipment": 1,
        "provider_employs_driver": 2,
        "provider_owns_vehicle": 3,
        "shipment_delivered_to_hospital": 4,
    }

    drivers_by_provider: dict[str, list[str]] = {}
    vehicles_by_provider: dict[str, list[str]] = {}
    for d in drivers:
        drivers_by_provider.setdefault(d["provider_id"], []).append(d["driver_id"])
    for v in vehicles:
        vehicles_by_provider.setdefault(v["provider_id"], []).append(v["vehicle_id"])

    hospital_rows = [
        (
            h["hospital_id"],
            _to_float(h["location_lat"]),
            _to_float(h["location_lon"]),
        )
        for h in hospitals
    ]

    for s in shipments:
        s_idx = shipment_idx[s["shipment_id"]]
        p_idx = provider_idx[s["assigned_provider_id"]]
        d_idx = driver_idx[s["assigned_driver_id"]]

        edge_src.extend([p_idx, s_idx])
        edge_dst.extend([s_idx, p_idx])
        edge_type.extend([
            edge_type_map["provider_handled_shipment"],
            edge_type_map["provider_handled_shipment"],
        ])

        edge_src.extend([d_idx, s_idx])
        edge_dst.extend([s_idx, d_idx])
        edge_type.extend([
            edge_type_map["driver_transported_shipment"],
            edge_type_map["driver_transported_shipment"],
        ])

        nearest_hospital_id = min(
            hospital_rows,
            key=lambda h: _haversine_km(
                _to_float(s["delivery_lat"]),
                _to_float(s["delivery_lon"]),
                h[1],
                h[2],
            ),
        )[0]
        h_idx = hospital_idx[nearest_hospital_id]
        edge_src.extend([s_idx, h_idx])
        edge_dst.extend([h_idx, s_idx])
        edge_type.extend([
            edge_type_map["shipment_delivered_to_hospital"],
            edge_type_map["shipment_delivered_to_hospital"],
        ])

    for provider_id, driver_ids in drivers_by_provider.items():
        p_idx = provider_idx[provider_id]
        for driver_id in driver_ids:
            d_idx = driver_idx[driver_id]
            edge_src.extend([p_idx, d_idx])
            edge_dst.extend([d_idx, p_idx])
            edge_type.extend([
                edge_type_map["provider_employs_driver"],
                edge_type_map["provider_employs_driver"],
            ])

    for provider_id, vehicle_ids in vehicles_by_provider.items():
        p_idx = provider_idx[provider_id]
        for vehicle_id in vehicle_ids:
            v_idx = vehicle_idx[vehicle_id]
            edge_src.extend([p_idx, v_idx])
            edge_dst.extend([v_idx, p_idx])
            edge_type.extend([
                edge_type_map["provider_owns_vehicle"],
                edge_type_map["provider_owns_vehicle"],
            ])

    data = Data(
        x=torch.tensor(x_rows, dtype=torch.float),
        edge_index=torch.tensor([edge_src, edge_dst], dtype=torch.long),
        edge_type=torch.tensor(edge_type, dtype=torch.long),
        y=torch.tensor(y_rows, dtype=torch.float),
        shipment_mask=torch.tensor(shipment_mask, dtype=torch.bool),
    )

    return data


def save_graph_data(data: Data, path: str | Path) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    torch.save(data, target)


def load_saved_graph(path: str | Path) -> Data:
    return torch.load(Path(path), weights_only=False)
