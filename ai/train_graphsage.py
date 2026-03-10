from __future__ import annotations

import argparse
import random

import torch
import torch.nn.functional as F
from torch import nn
from torch_geometric.data import Data
from torch_geometric.nn import SAGEConv

from graph_dataset import load_graph_data


class ShipmentGraphSAGE(nn.Module):
    def __init__(self, in_channels: int, hidden_channels: int = 64) -> None:
        super().__init__()
        self.conv1 = SAGEConv(in_channels, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, hidden_channels)
        self.head = nn.Linear(hidden_channels, 1)

    def forward(self, data: Data) -> torch.Tensor:
        x = self.conv1(data.x, data.edge_index)
        x = F.relu(x)
        x = self.conv2(x, data.edge_index)
        x = F.relu(x)
        logits = self.head(x).squeeze(-1)
        return logits


def split_masks(shipment_indices: torch.Tensor, seed: int = 42) -> tuple[torch.Tensor, torch.Tensor]:
    random.seed(seed)
    ids = shipment_indices.tolist()
    random.shuffle(ids)
    cut = int(len(ids) * 0.8)
    train_ids = set(ids[:cut])

    train_mask = torch.zeros_like(shipment_indices, dtype=torch.bool)
    val_mask = torch.zeros_like(shipment_indices, dtype=torch.bool)

    for i, node_idx in enumerate(shipment_indices.tolist()):
        if node_idx in train_ids:
            train_mask[i] = True
        else:
            val_mask[i] = True

    return train_mask, val_mask


def main() -> None:
    parser = argparse.ArgumentParser(description="Train GraphSAGE on synthetic healthcare logistics graph")
    parser.add_argument("--data-dir", default="ai/data")
    parser.add_argument("--epochs", type=int, default=40)
    parser.add_argument("--lr", type=float, default=0.01)
    args = parser.parse_args()

    data = load_graph_data(args.data_dir)
    model = ShipmentGraphSAGE(in_channels=data.x.size(1))
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)

    shipment_indices = torch.where(data.shipment_mask)[0]
    labels = data.y[shipment_indices]

    local_train_mask, local_val_mask = split_masks(shipment_indices)

    for epoch in range(1, args.epochs + 1):
        model.train()
        optimizer.zero_grad()

        logits = model(data)[shipment_indices]
        train_logits = logits[local_train_mask]
        train_labels = labels[local_train_mask]

        loss = F.binary_cross_entropy_with_logits(train_logits, train_labels)
        loss.backward()
        optimizer.step()

        model.eval()
        with torch.no_grad():
            val_logits = logits[local_val_mask]
            val_labels = labels[local_val_mask]
            val_probs = torch.sigmoid(val_logits)
            val_preds = (val_probs >= 0.5).float()
            acc = (val_preds == val_labels).float().mean().item() if len(val_labels) > 0 else 0.0

        if epoch % 5 == 0 or epoch == 1:
            print(f"epoch={epoch:03d} loss={loss.item():.4f} val_acc={acc:.4f}")


if __name__ == "__main__":
    main()
