from __future__ import annotations

import argparse
import csv
import math
import random
from pathlib import Path


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def weighted_choice(items: list[dict], weight_key: str) -> dict:
    total = sum(max(0.001, float(item[weight_key])) for item in items)
    r = random.random() * total
    upto = 0.0
    for item in items:
        w = max(0.001, float(item[weight_key]))
        upto += w
        if upto >= r:
            return item
    return items[-1]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return radius_km * 2 * math.asin(math.sqrt(a))


def generate_providers(count: int) -> list[dict]:
    providers: list[dict] = []
    for i in range(count):
        tier_boost = random.choice([0.0, 0.08, 0.14])
        success_rate = clamp(random.gauss(0.78 + tier_boost, 0.09), 0.45, 0.99)
        cold_chain = clamp(random.gauss(0.75 + tier_boost / 2, 0.12), 0.35, 0.99)
        avg_delay = clamp(random.gauss(1.8 - tier_boost * 4, 1.2), 0.0, 8.0)
        fleet_size = int(clamp(random.gauss(22 + tier_boost * 80, 15), 5, 120))
        refrigeration = clamp(random.gauss(0.72 + tier_boost / 2, 0.12), 0.3, 0.99)

        providers.append(
            {
                "provider_id": f"PROV-{i + 1:03d}",
                "success_rate": round(success_rate, 4),
                "cold_chain_compliance_score": round(cold_chain, 4),
                "average_delivery_delay": round(avg_delay, 3),
                "fleet_size": fleet_size,
                "refrigeration_capability_score": round(refrigeration, 4),
            }
        )
    return providers


def generate_drivers(count: int, providers: list[dict]) -> list[dict]:
    drivers: list[dict] = []
    for i in range(count):
        provider = weighted_choice(providers, "fleet_size")
        years_exp = clamp(random.gauss(6.0, 3.5), 0.2, 25.0)
        on_time = clamp(random.gauss(0.82 + years_exp / 100.0, 0.08), 0.45, 0.99)
        route_dev = clamp(random.gauss(0.1 - years_exp / 250.0, 0.05), 0.0, 0.35)

        drivers.append(
            {
                "driver_id": f"DRV-{i + 1:04d}",
                "provider_id": provider["provider_id"],
                "years_experience": round(years_exp, 3),
                "on_time_delivery_rate": round(on_time, 4),
                "route_deviation_rate": round(route_dev, 4),
            }
        )
    return drivers


def generate_vehicles(count: int, providers: list[dict]) -> list[dict]:
    vehicle_types = ["van", "truck", "reefer_truck"]
    refrigeration_types = ["none", "passive", "active", "ultra_low"]

    vehicles: list[dict] = []
    for i in range(count):
        provider = weighted_choice(providers, "fleet_size")
        vehicle_type = random.choice(vehicle_types)
        refrigeration_type = random.choices(
            refrigeration_types,
            weights=[0.15, 0.35, 0.4, 0.1],
            k=1,
        )[0]
        maintenance = clamp(random.gauss(0.8, 0.12), 0.35, 0.99)

        vehicles.append(
            {
                "vehicle_id": f"VEH-{i + 1:04d}",
                "provider_id": provider["provider_id"],
                "vehicle_type": vehicle_type,
                "refrigeration_type": refrigeration_type,
                "maintenance_score": round(maintenance, 4),
            }
        )
    return vehicles


def generate_hospitals(count: int) -> list[dict]:
    hospitals: list[dict] = []
    base_lat, base_lon = 12.97, 77.59
    for i in range(count):
        hospitals.append(
            {
                "hospital_id": f"HOSP-{i + 1:03d}",
                "location_lat": round(base_lat + random.uniform(-0.45, 0.45), 6),
                "location_lon": round(base_lon + random.uniform(-0.45, 0.45), 6),
                "capacity": int(clamp(random.gauss(350, 170), 50, 1200)),
            }
        )
    return hospitals


def generate_shipments(
    count: int,
    providers: list[dict],
    drivers: list[dict],
    vehicles: list[dict],
    hospitals: list[dict],
) -> list[dict]:
    cargo_types = ["vaccines", "blood", "diagnostic_kits", "medicines", "organs"]

    provider_by_id = {p["provider_id"]: p for p in providers}
    drivers_by_provider: dict[str, list[dict]] = {}
    vehicles_by_provider: dict[str, list[dict]] = {}

    for d in drivers:
        drivers_by_provider.setdefault(d["provider_id"], []).append(d)
    for v in vehicles:
        vehicles_by_provider.setdefault(v["provider_id"], []).append(v)

    shipments: list[dict] = []
    for i in range(count):
        hospital = random.choice(hospitals)
        pickup_lat = hospital["location_lat"] + random.uniform(-0.22, 0.22)
        pickup_lon = hospital["location_lon"] + random.uniform(-0.22, 0.22)
        delivery_lat = hospital["location_lat"] + random.uniform(-0.09, 0.09)
        delivery_lon = hospital["location_lon"] + random.uniform(-0.09, 0.09)

        distance_km = max(1.0, haversine_km(pickup_lat, pickup_lon, delivery_lat, delivery_lon))
        cargo_type = random.choice(cargo_types)
        temp_req = {
            "vaccines": random.choice([2, 4, 5]),
            "blood": random.choice([2, 4]),
            "diagnostic_kits": random.choice([4, 8, 15]),
            "medicines": random.choice([8, 15, 25]),
            "organs": random.choice([2, 4]),
        }[cargo_type]

        provider = weighted_choice(providers, "success_rate")
        provider_id = provider["provider_id"]
        provider_drivers = drivers_by_provider.get(provider_id) or drivers
        provider_vehicles = vehicles_by_provider.get(provider_id) or vehicles

        driver = random.choice(provider_drivers)
        vehicle = random.choice(provider_vehicles)

        p_success = float(provider["success_rate"])
        cold_chain = float(provider["cold_chain_compliance_score"])
        refrigeration_cap = float(provider["refrigeration_capability_score"])
        avg_delay = float(provider["average_delivery_delay"])

        driver_exp = float(driver["years_experience"])
        driver_on_time = float(driver["on_time_delivery_rate"])
        route_dev = float(driver["route_deviation_rate"])

        maintenance = float(vehicle["maintenance_score"])
        refrigeration_type = str(vehicle["refrigeration_type"])

        refrigeration_boost = {
            "none": -0.22,
            "passive": -0.05,
            "active": 0.08,
            "ultra_low": 0.12,
        }[refrigeration_type]

        base = -0.2
        base += (p_success - 0.5) * 2.2
        base += (cold_chain - 0.5) * 1.2
        base += (refrigeration_cap - 0.5) * 0.8
        base += (driver_on_time - 0.5) * 1.5
        base += min(driver_exp / 20.0, 1.0) * 0.6
        base += (maintenance - 0.5) * 0.7
        base += refrigeration_boost
        base -= min(distance_km / 220.0, 1.2) * 1.0
        base -= avg_delay / 18.0
        base -= route_dev * 1.2

        # More strict handling for colder payloads.
        if temp_req <= 5:
            base += (cold_chain - 0.7) * 0.9
            if refrigeration_type == "none":
                base -= 0.35

        probability = 1.0 / (1.0 + math.exp(-base))
        success = 1 if random.random() < probability else 0

        shipments.append(
            {
                "shipment_id": f"SHP-{i + 1:05d}",
                "pickup_lat": round(pickup_lat, 6),
                "pickup_lon": round(pickup_lon, 6),
                "delivery_lat": round(delivery_lat, 6),
                "delivery_lon": round(delivery_lon, 6),
                "cargo_type": cargo_type,
                "temperature_requirement": temp_req,
                "distance_km": round(distance_km, 3),
                "assigned_provider_id": provider_id,
                "assigned_driver_id": driver["driver_id"],
                "delivery_success": success,
            }
        )

    return shipments


def write_csv(path: Path, rows: list[dict], fieldnames: list[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic healthcare logistics graph dataset")
    parser.add_argument("--output-dir", default="ai/data", help="Directory for CSV output")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--providers", type=int, default=50)
    parser.add_argument("--drivers", type=int, default=200)
    parser.add_argument("--vehicles", type=int, default=100)
    parser.add_argument("--shipments", type=int, default=500)
    parser.add_argument("--hospitals", type=int, default=30)
    args = parser.parse_args()

    random.seed(args.seed)

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    providers = generate_providers(args.providers)
    drivers = generate_drivers(args.drivers, providers)
    vehicles = generate_vehicles(args.vehicles, providers)
    hospitals = generate_hospitals(args.hospitals)
    shipments = generate_shipments(args.shipments, providers, drivers, vehicles, hospitals)

    write_csv(
        out_dir / "providers.csv",
        providers,
        [
            "provider_id",
            "success_rate",
            "cold_chain_compliance_score",
            "average_delivery_delay",
            "fleet_size",
            "refrigeration_capability_score",
        ],
    )
    write_csv(
        out_dir / "drivers.csv",
        drivers,
        [
            "driver_id",
            "provider_id",
            "years_experience",
            "on_time_delivery_rate",
            "route_deviation_rate",
        ],
    )
    write_csv(
        out_dir / "vehicles.csv",
        vehicles,
        [
            "vehicle_id",
            "provider_id",
            "vehicle_type",
            "refrigeration_type",
            "maintenance_score",
        ],
    )
    write_csv(
        out_dir / "hospitals.csv",
        hospitals,
        ["hospital_id", "location_lat", "location_lon", "capacity"],
    )
    write_csv(
        out_dir / "shipments.csv",
        shipments,
        [
            "shipment_id",
            "pickup_lat",
            "pickup_lon",
            "delivery_lat",
            "delivery_lon",
            "cargo_type",
            "temperature_requirement",
            "distance_km",
            "assigned_provider_id",
            "assigned_driver_id",
            "delivery_success",
        ],
    )

    print(f"Synthetic dataset generated at: {out_dir}")
    print(
        f"providers={len(providers)}, drivers={len(drivers)}, vehicles={len(vehicles)}, shipments={len(shipments)}, hospitals={len(hospitals)}"
    )


if __name__ == "__main__":
    main()
