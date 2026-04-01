# /app/models/text_visuals.py

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.common import Localized, ISODate


class TextVisualBackground(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: str  # 'image' | 'color' | 'gradient'
    imageUrl: Optional[str] = None
    color: Optional[str] = None
    gradient: Optional[str] = None


class TextVisualTypography(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fontFamily: str = "Inter"
    fontSize: int = 16
    fontWeight: int = 400
    textAlign: str = "left"  # left | center | right
    lineHeight: float = 1.5
    color: str = "#000000"


class TextVisualTextBox(BaseModel):
    model_config = ConfigDict(extra="forbid")

    x: float = 0
    y: float = 0
    width: float = 100
    height: float = 100
    padding: float = 0


class TextVisualOverlay(BaseModel):
    model_config = ConfigDict(extra="forbid")

    color: str = "#000000"
    opacity: float = 0.5
    blur: Optional[float] = None


class EntityLifecycle(str, Enum):
    template = "template"
    draft = "draft"
    saved = "saved"
    published = "published"


class TextVisualData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    lifecycle: EntityLifecycle = EntityLifecycle.draft
    dateCreated: ISODate
    title: Optional[Localized] = None
    subtitle: Optional[Localized] = None
    body: Optional[Localized] = None
    caption: Optional[Localized] = None
    background: TextVisualBackground
    typography: TextVisualTypography = Field(default_factory=TextVisualTypography)
    textBox: TextVisualTextBox = Field(default_factory=TextVisualTextBox)
    overlay: Optional[TextVisualOverlay] = None
    tags: list[str] = Field(default_factory=list)


class CreateTextVisualRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dateCreated: ISODate
    lifecycle: EntityLifecycle = EntityLifecycle.draft
    title: Optional[Localized] = None
    subtitle: Optional[Localized] = None
    body: Optional[Localized] = None
    caption: Optional[Localized] = None
    background: TextVisualBackground
    typography: TextVisualTypography = Field(default_factory=TextVisualTypography)
    textBox: TextVisualTextBox = Field(default_factory=TextVisualTextBox)
    overlay: Optional[TextVisualOverlay] = None
    tags: list[str] = Field(default_factory=list)


class TextVisualCatalog(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: int = Field(ge=1, default=1)
    updatedAt: str
    order: list[str] = Field(default_factory=list)
    items: dict[str, TextVisualData] = Field(default_factory=dict)
