import json
import os
from datetime import datetime, timezone


class Catalog:
    def __init__(self, path: str):
        self.path = path
        self.data = self.load()

    def load(self):
        if not os.path.exists(self.path):
            return {
                "catalogVersion": 0,
                "updatedAt": self.now(),
                "order": [],
                "items": {},
            }
        with open(self.path, "r", encoding="utf-8") as f:
            return json.load(f)

    def save(self):
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)

    def now(self):
        return datetime.now(timezone.utc).isoformat()
