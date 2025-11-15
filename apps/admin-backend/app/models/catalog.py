from csv import Error
from dataclasses import dataclass
from typing import Dict, List
import json
import os
from datetime import datetime, timezone
from app.models.art_item import ArtItem
from ..settings import settings


@dataclass
class Catalog:
    catalogVersion: int
    updatedAt: str
    items: Dict[str, "ArtItem"]
    order: List[str]

    def __init__(self):
        self.path = os.path.join(
            settings.storage_root, settings.json_data, "catalog.json"
        )

    def _touch(self):
        self.catalogVersion += 1
        self.updatedAt = datetime.now(timezone.utc).isoformat()

    def load(self):
        if not os.path.exists(self.path):
            raise Error("Catalog file does not exist")
        with open(self.path, "r", encoding="utf-8") as f:
            self.catalog = json.load(f)

    def validate(self) -> None:
        ids_items = set(self.items.keys())
        ids_orders = list(self.order)

        # 1. Order list checking for dublicates:
        if len(ids_orders) != len(set(ids_orders)):
            raise ValueError("Catalog.order contains duplicate IDs")

        # 2. Checking all orders ids are in the items:
        missing = [id_ for id_ in ids_orders if id_ not in self.items]
        if missing:
            raise ValueError(f"Catalog.order has IDs not in items: {missing}")

        # 3 Checking all form items are in the order:
        extra = [id_ for id_ in ids_items if id_ not in self.order]
        if extra:
            raise ValueError(f"Catalog.items has IDs not in order: {extra}")

    def add_or_update(self, item: ArtItem) -> str:
        # Load newest catalog:
        self.load()
        # If item is new add id to order list to first position:
        existed = item.id in self.catalog.items
        if not existed:
            self.order.insert(0, item.id)
        # Save or update received item to dictionary:
        self.catalog.items[item.id] = item
        self.validate()
        self._touch()
        return "update" if existed else "created"

    def save_catalog(self):
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self.path, f, ensure_ascii=False, indent=2)

    def now(self):
        return datetime.now(timezone.utc).isoformat()
