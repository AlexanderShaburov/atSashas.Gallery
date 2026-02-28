# app/models/home_doc.py

from __future__ import annotations

from typing import Annotated, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field


class HomeStreamRef(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["streamRef"] = "streamRef"
    streamSlug: str = Field(min_length=1)
    size: Literal["S", "M", "L"] = "M"
    thumbOverrideUrl: Optional[str] = None


class HomeBlockRef(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["blockRef"] = "blockRef"
    blockId: str = Field(min_length=1)
    size: Literal["S", "M", "L"] = "M"


HomeItem = Annotated[
    Union[HomeStreamRef, HomeBlockRef],
    Field(discriminator="kind"),
]


class HomeDoc(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[HomeItem] = Field(default_factory=list)
    version: int = Field(ge=0, default=1)
    createdAt: str
    updatedAt: str
