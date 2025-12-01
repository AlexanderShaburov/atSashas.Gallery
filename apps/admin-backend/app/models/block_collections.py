from __future__ import annotations

import json
from pathlib import Path

from enum import Enum
from typing import List, Optional, Union, Annotated, Literal

from pydantic import (
    BaseModel,
    Field,
    field_validator,
    ConfigDict,
    ValidationError,
)
from datetime import datetime, timezone

from app.models.common import Localized, ISODate
from app.services.block_collections_service import generate_block_collection_id


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


class BlocksCollectionJSON(BaseModel):
    """
    Pydantic model for Block Collection JSON structure.
    """

    collectionId: str
    collectionName: str
    version: int
    updatedAt: ISODate
    blocks: List[Block]

    model_config = ConfigDict(extra="forbid")

    # ------------------------------------------------------
    # FACTORY: создать новую пустую коллекцию
    # ------------------------------------------------------
    @classmethod
    def create_empty(cls) -> "BlocksCollectionJSON":
        """
        Create a brand-new empty block collection with generated ID.
        """
        return cls(
            collectionId=generate_block_collection_id(),
            collectionName="",
            version=0,
            updatedAt=datetime.now(timezone.utc).date().isoformat(),
            blocks=[],
        )

    # ---------------------------------------
    # 1) Validate raw dict
    # ---------------------------------------
    @classmethod
    def validate_data(
        cls, data: dict | BlocksCollectionJSON
    ) -> "BlocksCollectionJSON":
        """
        Validate a Python dict and return a fully validated model.
        Raises ValidationError on invalid structure.
        """
        return cls.model_validate(data)

    # ---------------------------------------
    # 2) Load directly from file
    # ---------------------------------------
    @classmethod
    def load_from_file(cls, path: Path) -> "BlocksCollectionJSON":
        """
        Open file, parse JSON, validate it and return the model.
        """
        raw = json.loads(path.read_text(encoding="utf-8"))
        return cls.model_validate(raw)

    # ---------------------------------------
    # 3) Safe version: returns (ok, value_or_error)
    # ---------------------------------------
    @classmethod
    def try_load_from_file(cls, path: Path):
        """
        Safe version: no exceptions.
        Returns tuple: (True, model) OR (False, ValidationError).
        """
        try:
            model = cls.load_from_file(path)
            return True, model
        except ValidationError as e:
            return False, e
        except json.JSONDecodeError as e:
            return False, e


class CollectionSeed(BaseModel):
    id: str
    name: str
