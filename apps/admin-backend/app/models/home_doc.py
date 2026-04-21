# app/models/home_doc.py

from __future__ import annotations

from typing import Annotated, Literal, Optional, Union

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class HomeStreamRef(BaseModel):
    # extra="forbid" stays; streamSlug is accepted via validation alias, not as "extra".
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    kind: Literal["streamRef"] = "streamRef"
    # Canonical: streamId. Legacy data may still key it as streamSlug; both are accepted on read.
    streamId: str = Field(
        min_length=1,
        validation_alias=AliasChoices("streamId", "streamSlug"),
    )
    # Legacy; tolerated on read, not emitted on write when None (see repo save-path).
    size: Optional[Literal["S", "M", "L"]] = None
    thumbOverrideUrl: Optional[str] = None


class HomeEventRef(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["eventRef"] = "eventRef"
    eventPageId: str = Field(min_length=1)


HomeItem = Annotated[
    Union[HomeStreamRef, HomeEventRef],
    Field(discriminator="kind"),
]


class HomeDoc(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[HomeItem] = Field(default_factory=list)
    version: int = Field(ge=0, default=1)
    createdAt: str
    updatedAt: str
