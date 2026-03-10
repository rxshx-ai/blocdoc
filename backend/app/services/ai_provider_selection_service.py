from __future__ import annotations

from dataclasses import dataclass

import torch
import torch.nn.functional as F
from torch import Tensor, nn
from torch_geometric.data import Data
from torch_geometric.nn import SAGEConv

from app.models.ai_requests import AISelectProviderRequest


class GraphSAGEModel(nn.Module):
    def __init__(self, in_channels: int, hidden_channels: int = 32) -> None:
        super().__init__()
        self.conv1 = SAGEConv(in_channels, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, hidden_channels)
        self.classifier = nn.Linear(hidden_channels, 1)

    def forward(self, x: Tensor, edge_index: Tensor) -> Tensor:
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = self.conv2(x, edge_index)
        x = F.relu(x)
        logits = self.classifier(x).squeeze(-1)
        return logits


@dataclass
class ProviderNodeRef:
    provider_id: str
    bid: dict
    node_index: int


class AIProviderSelectionService:
    """GraphSAGE-based provider selector using a relationship graph per request."""

    def __init__(self) -> None:
        self._feature_size = 14

    def select_provider(self, payload: AISelectProviderRequest) -> dict:
        if not payload.provider_bids:
            raise ValueError("No provider bids supplied")

        graph, provider_refs, labels = self._build_graph(payload)
        model = GraphSAGEModel(in_channels=self._feature_size)
        self._train(model, graph, labels)

        model.eval()
        with torch.no_grad():
            logits = model(graph.x, graph.edge_index)
            probs = torch.sigmoid(logits)

        max_price = max(b.price for b in payload.provider_bids)
        max_eta = max(b.estimated_delivery_time for b in payload.provider_bids)

        best_ref = None
        best_prob = 0.0
        best_score = -1.0

        for ref in provider_refs:
            gnn_prob = float(probs[ref.node_index].item())
            price_score = 1.0 if max_price == 0 else 1.0 - (ref.bid["price"] / max_price)
            eta_score = 1.0 if max_eta == 0 else 1.0 - (ref.bid["estimated_delivery_time"] / max_eta)
            final_score = (gnn_prob * 0.7) + (price_score * 0.15) + (eta_score * 0.15)

            if final_score > best_score:
                best_score = final_score
                best_prob = gnn_prob
                best_ref = ref

        if best_ref is None:
            raise ValueError("Unable to select provider")

        return {
            "selected_provider": best_ref.provider_id,
            "gnn_success_probability": round(best_prob, 6),
            "final_score": round(best_score, 6),
        }

    def select_best_bid(self, bids: list[dict]) -> dict:
        """Compatibility adapter for existing logistics flow."""
        if not bids:
            raise ValueError("No bids available for AI provider selection")

        driver_inputs = [
            {
                "driver_id": bid["driver_id"],
                "experience_years": 3.0,
                "on_time_rate": 0.85,
                "safety_score": 0.9,
            }
            for bid in bids
        ]
        payload = AISelectProviderRequest(
            shipment_data={
                "shipment_id": bids[0].get("shipment_id", "synthetic-shipment"),
                "cargo_type": "medical",
                "temperature_requirement": 4.0,
                "distance_km": 25.0,
                "urgency_level": 0.6,
                "hospital_id": "hospital-default",
            },
            provider_bids=[
                {
                    "provider_id": bid["provider_id"],
                    "driver_id": bid["driver_id"],
                    "vehicle_id": bid.get("vehicle_id", f"vehicle-{bid['provider_id']}"),
                    "price": bid["price"],
                    "estimated_delivery_time": bid["estimated_delivery_time"],
                    "historical_success_rate": bid.get("historical_success_rate", 0.85),
                    "vehicle_reliability": bid.get("vehicle_reliability", 0.85),
                }
                for bid in bids
            ],
            driver_features=driver_inputs,
        )

        selection = self.select_provider(payload)
        for bid in bids:
            if bid["provider_id"] == selection["selected_provider"]:
                bid_copy = dict(bid)
                bid_copy["scores"] = {
                    "gnn_prediction_score": selection["gnn_success_probability"],
                    "eta_score": 0.0,
                    "price_score": 0.0,
                    "combined_score": selection["final_score"],
                }
                return bid_copy
        raise ValueError("Selected provider not found in bid list")

    def _train(self, model: GraphSAGEModel, graph: Data, labels: Tensor) -> None:
        optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
        mask = graph.train_mask
        for _ in range(120):
            model.train()
            optimizer.zero_grad()
            logits = model(graph.x, graph.edge_index)
            loss = F.binary_cross_entropy_with_logits(logits[mask], labels[mask])
            loss.backward()
            optimizer.step()

    def _build_graph(self, payload: AISelectProviderRequest) -> tuple[Data, list[ProviderNodeRef], Tensor]:
        x_rows: list[list[float]] = []
        labels: list[float] = []
        train_mask: list[bool] = []
        edges: list[tuple[int, int]] = []

        provider_refs: list[ProviderNodeRef] = []
        driver_index_by_id: dict[str, int] = {}
        vehicle_index_by_id: dict[str, int] = {}

        shipment = payload.shipment_data
        shipment_idx = self._add_node(
            x_rows,
            labels,
            train_mask,
            [0, 0, 0, 1, 0, shipment.distance_km / 500.0, shipment.urgency_level, shipment.temperature_requirement / 100.0],
            label=0.0,
            is_train=False,
        )
        hospital_idx = self._add_node(
            x_rows,
            labels,
            train_mask,
            [0, 0, 0, 0, 1, shipment.urgency_level, shipment.distance_km / 500.0, 0.0],
            label=0.0,
            is_train=False,
        )
        edges.extend([(shipment_idx, hospital_idx), (hospital_idx, shipment_idx)])

        driver_map = {d.driver_id: d for d in payload.driver_features}

        max_price = max((b.price for b in payload.provider_bids), default=1.0)
        max_eta = max((b.estimated_delivery_time for b in payload.provider_bids), default=1.0)

        for bid in payload.provider_bids:
            provider_features = [
                1,
                0,
                0,
                0,
                0,
                bid.historical_success_rate,
                bid.vehicle_reliability,
                bid.price / max(max_price, 1.0),
                bid.estimated_delivery_time / max(max_eta, 1.0),
            ]
            provider_idx = self._add_node(
                x_rows,
                labels,
                train_mask,
                provider_features,
                label=self._label_from_bid(bid.historical_success_rate, bid.vehicle_reliability, bid.price, bid.estimated_delivery_time, max_price, max_eta),
                is_train=True,
            )
            provider_refs.append(
                ProviderNodeRef(
                    provider_id=bid.provider_id,
                    bid={
                        "price": bid.price,
                        "estimated_delivery_time": bid.estimated_delivery_time,
                    },
                    node_index=provider_idx,
                )
            )

            edges.extend([(provider_idx, shipment_idx), (shipment_idx, provider_idx)])

            if bid.driver_id not in driver_index_by_id:
                d = driver_map.get(bid.driver_id)
                driver_features = [
                    0,
                    1,
                    0,
                    0,
                    0,
                    0.0 if d is None else d.experience_years / 20.0,
                    0.0 if d is None else d.on_time_rate,
                    0.0 if d is None else d.safety_score,
                ]
                driver_index_by_id[bid.driver_id] = self._add_node(
                    x_rows,
                    labels,
                    train_mask,
                    driver_features,
                    label=0.0,
                    is_train=False,
                )
            driver_idx = driver_index_by_id[bid.driver_id]
            edges.extend([(provider_idx, driver_idx), (driver_idx, provider_idx)])

            if bid.vehicle_id not in vehicle_index_by_id:
                vehicle_features = [
                    0,
                    0,
                    1,
                    0,
                    0,
                    bid.vehicle_reliability,
                    shipment.temperature_requirement / 100.0,
                    0.0,
                ]
                vehicle_index_by_id[bid.vehicle_id] = self._add_node(
                    x_rows,
                    labels,
                    train_mask,
                    vehicle_features,
                    label=0.0,
                    is_train=False,
                )
            vehicle_idx = vehicle_index_by_id[bid.vehicle_id]
            edges.extend([(driver_idx, shipment_idx), (shipment_idx, driver_idx)])
            edges.extend([(provider_idx, vehicle_idx), (vehicle_idx, provider_idx)])

        x = torch.tensor([self._pad_features(row) for row in x_rows], dtype=torch.float)
        edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous()
        y = torch.tensor(labels, dtype=torch.float)
        mask = torch.tensor(train_mask, dtype=torch.bool)

        graph = Data(x=x, edge_index=edge_index)
        graph.train_mask = mask
        return graph, provider_refs, y

    @staticmethod
    def _label_from_bid(
        success_rate: float,
        reliability: float,
        price: float,
        eta: float,
        max_price: float,
        max_eta: float,
    ) -> float:
        price_score = 1.0 if max_price <= 0 else 1.0 - (price / max_price)
        eta_score = 1.0 if max_eta <= 0 else 1.0 - (eta / max_eta)
        score = (success_rate * 0.5) + (reliability * 0.2) + (price_score * 0.15) + (eta_score * 0.15)
        return 1.0 if score >= 0.6 else 0.0

    @staticmethod
    def _add_node(
        x_rows: list[list[float]],
        labels: list[float],
        train_mask: list[bool],
        features: list[float],
        label: float,
        is_train: bool,
    ) -> int:
        x_rows.append(features)
        labels.append(label)
        train_mask.append(is_train)
        return len(x_rows) - 1

    def _pad_features(self, row: list[float]) -> list[float]:
        if len(row) >= self._feature_size:
            return row[: self._feature_size]
        return row + [0.0] * (self._feature_size - len(row))
