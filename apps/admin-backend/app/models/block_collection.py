# /app/models/block_collection.py

from __future__ import annotations

from enum import Enum
from typing import Dict, List, Optional, Union, Annotated, Literal

from pydantic import BaseModel, Field, ConfigDict, model_validator
from datetime import datetime, timezone

from app.models.common import Localized, ISODate


# ==============================
# Enums aligned with TS
# ==============================


class BlockLifecycle(str, Enum):
    TEMPLATE = "template"
    DRAFT = "draft"
    SAVED = "saved"


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
    UP = "Up"
    BOTTOM = "Bottom"


class GalleryLayout(str, Enum):
    SINGLE = "single"
    PAIR_HORIZONTAL = "pairHorizontal"
    PAIR_VERTICAL = "pairVertical"
    TRIPTYCH_LEFT = "triptychLeft"
    TRIPTYCH_RIGHT = "triptychRight"
    TRIPTYCH_HORIZONTAL = "triptychHorizontal"


class TextVariant(str, Enum):
    FULL = "full"
    NARROW = "narrow"
    QUOTE = "quote"


# ==============================
# Base + block variants
# ==============================


class BlockBase(BaseModel):
    """
    Aligned with TS BlockBase:
      id, blockKind, lifecycle, isTemplate?, tags?, dateCreated, caption?
    """

    id: str
    blockKind: Literal["gallery", "text", "cta", "eventCta"]
    lifecycle: BlockLifecycle

    # Legacy compatibility (optional)
    isTemplate: Optional[bool] = None

    tags: Optional[List[str]] = None
    dateCreated: ISODate
    caption: Optional[Localized] = None

    model_config = ConfigDict(extra="forbid")


class GalleryArtItem(BaseModel):
    kind: Literal["art"] = "art"
    artId: str
    position: ItemPosition
    caption: Optional[Localized] = None

    model_config = ConfigDict(extra="forbid")


class GalleryEventItem(BaseModel):
    kind: Literal["eventCta"] = "eventCta"
    eventId: str
    position: ItemPosition
    buttonLabel: Optional[Localized] = None
    backgroundArtId: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


GalleryBlockItem = Annotated[
    Union[GalleryArtItem, GalleryEventItem],
    Field(discriminator="kind"),
]


class GalleryBlock(BlockBase):
    blockKind: Literal["gallery"] = "gallery"

    layout: GalleryLayout
    items: List[GalleryBlockItem]  # TS allows empty list -> no validator

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode='before')
    @classmethod
    def normalize_items(cls, data):
        if isinstance(data, dict) and 'items' in data:
            for item in data['items']:
                if isinstance(item, dict) and 'kind' not in item:
                    item['kind'] = 'art'
        return data


class TextBlock(BlockBase):
    blockKind: Literal["text"] = "text"

    title: Optional[Localized] = None
    body: Optional[Localized] = None  # TS: Localized | undefined
    variant: Optional[TextVariant] = None

    model_config = ConfigDict(extra="forbid")


# ==============================
# CTA targets (aligned with TS optional fields)
# ==============================


class CtaTargetStream(BaseModel):
    type: Literal["stream"] = "stream"
    slug: Optional[str] = None  # TS optional

    model_config = ConfigDict(extra="forbid")


class CtaTargetExternal(BaseModel):
    type: Literal["external"] = "external"
    url: Optional[str] = None  # TS optional

    model_config = ConfigDict(extra="forbid")


class CtaTargetEvent(BaseModel):
    type: Literal["event"] = "event"
    eventId: str  # TS required

    model_config = ConfigDict(extra="forbid")


CtaTarget = Annotated[
    Union[CtaTargetStream, CtaTargetExternal, CtaTargetEvent],
    Field(discriminator="type"),
]


class CtaBlock(BlockBase):
    blockKind: Literal["cta"] = "cta"

    title: Optional[Localized] = None  # TS: Localized | undefined
    body: Optional[Localized] = None  # TS: optional
    buttonLabel: Optional[Localized] = None  # TS: Localized | undefined
    target: Optional[CtaTarget] = None  # TS: CtaTarget | undefined

    model_config = ConfigDict(extra="forbid")


# ==============================
# Discriminated union
# ==============================

class EventCtaBlock(BlockBase):
    blockKind: Literal["eventCta"] = "eventCta"
    eventId: str = Field(min_length=1)
    buttonLabel: Optional[Localized] = None

    model_config = ConfigDict(extra="forbid")


Block = Annotated[
    Union[GalleryBlock, TextBlock, CtaBlock, EventCtaBlock],
    Field(discriminator="blockKind"),
]


# ==============================
# Blocks collection (оставил как у тебя)
# ==============================


class BlockCollectionStats(BaseModel):
    totalBlocks: int
    byKind: Dict[str, int]

    model_config = ConfigDict(extra="forbid")


class BlockCollection(BaseModel):
    kind: Literal["BlockCollection"] = "BlockCollection"
    version: int
    generatedAt: ISODate
    updatedAt: ISODate

    blocks: Dict[str, Block]
    order: List[str]

    stats: Optional[BlockCollectionStats] = None
    tagsIndex: Optional[Dict[str, List[str]]] = None
    kindIndex: Optional[Dict[str, List[str]]] = None

    model_config = ConfigDict(extra="forbid")

    def _touch(self) -> None:
        self.version += 1
        self.updatedAt = datetime.now(timezone.utc).date().isoformat()

    @classmethod
    def create_empty(cls) -> "BlockCollection":
        now = datetime.now(timezone.utc).date().isoformat()
        return cls(
            kind="BlockCollection",
            version=1,
            generatedAt=now,
            updatedAt=now,
            blocks={},
            order=[],
            stats=None,
            tagsIndex=None,
            kindIndex=None,
        )

    def add_or_update(self, block_payload: Block) -> str:
        block = block_payload.model_copy(
            update={
                "lifecycle": "saved",
            }
        )

        existed = block.id in self.blocks

        if not existed:
            self.order.insert(0, block.id)

        self.blocks[block.id] = block
        self._touch()

        return "updated" if existed else "created"

    def remove(self, id: str):
        del self.blocks[id]
        self.order.remove(id)
        self._touch()

        return "removed"
