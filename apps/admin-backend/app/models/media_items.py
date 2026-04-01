# /app/models/media_items.py

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.common import Localized, ISODate, PreviewSources


class MediaItemKind(str, Enum):
    image = "image"
    video = "video"


class EntityLifecycle(str, Enum):
    template = "template"
    draft = "draft"
    saved = "saved"
    published = "published"


class ImageSources(BaseModel):
    model_config = ConfigDict(extra="forbid")

    preview: PreviewSources
    full: str


class VideoSources(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str
    posterUrl: Optional[str] = None


class MediaSources(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: MediaItemKind
    sources: Optional[ImageSources] = None  # when kind == image
    videoSources: Optional[VideoSources] = None  # when kind == video


class MediaItemDimensions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    width: int
    height: int


class MediaItemData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    lifecycle: EntityLifecycle = EntityLifecycle.draft
    dateCreated: ISODate
    media: MediaSources
    title: Optional[Localized] = None
    alt: Optional[Localized] = None
    dimensions: Optional[MediaItemDimensions] = None
    tags: list[str] = Field(default_factory=list)


class CreateMediaItemRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dateCreated: ISODate
    lifecycle: EntityLifecycle = EntityLifecycle.draft
    media: MediaSources
    title: Optional[Localized] = None
    alt: Optional[Localized] = None
    dimensions: Optional[MediaItemDimensions] = None
    tags: list[str] = Field(default_factory=list)


class MediaItemCatalog(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: int = Field(ge=1, default=1)
    updatedAt: str
    order: list[str] = Field(default_factory=list)
    items: dict[str, MediaItemData] = Field(default_factory=dict)
