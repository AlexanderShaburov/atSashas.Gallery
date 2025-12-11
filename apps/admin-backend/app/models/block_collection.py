# /app/models/block_collection.py

from __future__ import annotations


from enum import Enum
from typing import Dict, List, Optional, Union, Annotated, Literal

from pydantic import (
    BaseModel,
    Field,
    field_validator,
    ConfigDict,
)
from datetime import datetime, timezone

from app.models.common import Localized, ISODate


# ==============================
# Block system
# ==============================


class ItemPosition(str, Enum):
    LUC = "LUC"

    LBC = "LBC"
    RUC = "RUC"
    RBC = "RBC"
    LS = "LS"
    RS = "RS"
    LEFT = "Left"
    CENTER = "Center"
    RIGHT = "Right"


class GalleryLayout(str, Enum):
    SINGLE = "single"
    PAIR_HORIZONTAL = "pairHorizontal"
    PAIR_VERTICAL = "pairVertical"
    TRIPTYCH_LEFT = "triptychLeft"
    TRIPTYCH_RIGHT = "triptychRight"
    TRIPTYCH_HORIZONTAL = "triptychHorizontal"


class BlockBase(BaseModel):
    """Base fields shared by all new block kinds (without discriminator)."""

    id: str
    tags: Optional[List[str]] = None
    dateCreated: ISODate

    model_config = ConfigDict(extra="forbid")  # helps catch typos in JSON


class GalleryBlockItem(BaseModel):
    artId: str
    position: ItemPosition
    caption: Optional[Localized] = None


class GalleryBlock(BlockBase):
    # Discriminator value for this variant
    blockKind: Literal["gallery"] = "gallery"

    layout: GalleryLayout
    items: List[GalleryBlockItem]

    @field_validator("items")
    def ensure_non_empty_items(
        cls, v: List[GalleryBlockItem]
    ) -> List[GalleryBlockItem]:
        if not v:
            raise ValueError("items must be a non-empty list")
        return v


class TextVariant(str, Enum):
    FULL = "full"
    NARROW = "narrow"
    QUOTE = "quote"


class TextBlock(BlockBase):
    blockKind: Literal["text"] = "text"

    title: Optional[Localized] = None
    body: Localized
    variant: Optional[TextVariant] = None


# ==============================
# CTA targets
# ==============================


class CtaTargetStream(BaseModel):
    type: Literal["stream"] = "stream"
    slug: str  # e.g. "mixart" or "event-rome-workshop"


class CtaTargetExternal(BaseModel):
    type: Literal["external"] = "external"
    url: str  # external link, e.g. payment link


class CtaTargetEvent(BaseModel):
    type: Literal["event"] = "event"
    eventId: str  # will be useful when you introduce Event entity


CtaTarget = Annotated[
    Union[CtaTargetStream, CtaTargetExternal, CtaTargetEvent],
    Field(discriminator="type"),
]


class CtaBlock(BlockBase):
    blockKind: Literal["cta"] = "cta"

    title: Localized
    body: Optional[Localized] = None
    buttonLabel: Localized
    target: CtaTarget


# ==============================
# Discriminated union for new blocks
# ==============================

Block = Annotated[
    Union[GalleryBlock, TextBlock, CtaBlock],
    Field(discriminator="blockKind"),
]


# ==============================
# Blocks collection
# ==============================


class BlockCollectionStats(BaseModel):
    """Optional aggregated stats about blocks (can be filled on save)."""

    totalBlocks: int
    byKind: Dict[str, int]  # e.g. {"gallery": 10, "text": 5, "cta": 2}


class BlockCollection(BaseModel):
    """
    Single global collection of all blocks.

    Similar to Catalog:
    - version: increments on each change
    - updatedAt: last modification datetime (ISO)
    - blocks: id -> Block
    - order: explicit order of block IDs
    """

    kind: Literal["BlockCollection"] = "BlockCollection"
    version: int
    generatedAt: ISODate
    updatedAt: ISODate

    blocks: Dict[str, "Block"]
    order: List[str]

    stats: Optional[BlockCollectionStats] = None
    # Optional indices – you can ignore them at first and add later
    tagsIndex: Optional[Dict[str, List[str]]] = None
    kindIndex: Optional[Dict[str, List[str]]] = None

    model_config = ConfigDict(extra="forbid")

    # -------------------------
    # Internal helpers
    # -------------------------
    @field_validator("order")
    @classmethod
    def _order_without_duplicates(cls, v: List[str]) -> List[str]:
        """Ensure there are no duplicate IDs in order list."""
        seen = set()
        duplicates: List[str] = []
        for id_ in v:
            if id_ in seen:
                duplicates.append(id_)
            else:
                seen.add(id_)

        if duplicates:
            raise ValueError(
                f"BlockCollection.order has duplicate ids: {duplicates}"
            )
        return v

    def _touch(self) -> None:
        """Increment version and update updatedAt timestamp."""
        self.version += 1
        self.updatedAt = datetime.now(timezone.utc).date().isoformat()

    # -------------------------
    # Validation of relations
    # -------------------------
    def validate_relations(self) -> None:
        """
        Ensure that:
        - all IDs in order exist in blocks
        - all blocks are present in order
        """
        ids_blocks = set(self.blocks.keys())
        ids_order = list(self.order)

        # 1) All ids in order must exist in blocks
        missing_in_blocks = [id_ for id_ in ids_order if id_ not in ids_blocks]
        if missing_in_blocks:
            raise ValueError(
                f"BlockCollection.order has ids not present in blocks: {missing_in_blocks}"
            )

        # 2) All blocks must be referenced in order
        missing_in_order = [id_ for id_ in ids_blocks if id_ not in ids_order]
        if missing_in_order:
            raise ValueError(
                f"BlockCollection.blocks has ids not present in order: {missing_in_order}"
            )

    # -------------------------
    # Public API (like Catalog)
    # -------------------------
    def add_or_update(self, block: "Block") -> str:
        """
        Insert or update block by its id.

        If block is new:
        - add its id to the beginning of order list.

        Returns "created" or "update".
        """
        block_id = block.id
        existed = block_id in self.blocks

        if not existed:
            # New block goes to the top:
            self.order.insert(0, block_id)

        # Save or update block in dictionary:
        self.blocks[block_id] = block

        # Structural validation and bump version:
        self.validate_relations()
        self._touch()

        return "update" if existed else "created"

    def remove(self, block_id: str) -> None:
        """
        Remove block from collection (dict + order).

        If block_id not found, does nothing.
        """
        if block_id not in self.blocks:
            return

        # Remove from dict
        del self.blocks[block_id]

        # Remove from order
        self.order = [id_ for id_ in self.order if id_ != block_id]

        # Validate and bump version:
        self.validate_relations()
        self._touch()

    # -------------------------
    # Factories
    # -------------------------
    @classmethod
    def create_empty(cls) -> "BlockCollection":
        """
        Create brand new empty collection of blocks.
        Useful for repo when file does not exist yet.
        """
        now = datetime.now(timezone.utc).date().isoformat()
        return cls(
            version=1,
            generatedAt=now,
            updatedAt=now,
            blocks={},
            order=[],
            stats=None,
            tagsIndex=None,
            kindIndex=None,
        )
