from pydantic import BaseModel
from typing import Dict, List
from datetime import datetime, timezone
from app.models.art_item import ArtItem


class Catalog(BaseModel):
    catalogVersion: int
    updatedAt: str
    items: Dict[str, "ArtItem"]
    order: List[str]

    def _touch(self):
        self.catalogVersion += 1
        self.updatedAt = datetime.now(timezone.utc).isoformat()

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
        # If item is new add id to order list to first position:
        existed = item.id in self.items
        if not existed:
            self.order.insert(0, item.id)
        # Save or update received item to dictionary:
        self.items[item.id] = item
        self.validate()
        self._touch()
        return "update" if existed else "created"
