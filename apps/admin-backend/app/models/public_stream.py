# app/models/public_stream.py
from pydantic import BaseModel, Field


class PublicStreamData(BaseModel):
    """
    PublicStream - curated list of streams visible to public users
    """

    kind: str = Field(default="PublicStream", pattern="^PublicStream$")
    version: int = Field(ge=0)
    streamIds: list[str] = Field(default_factory=list)
    createdAt: str
    updatedAt: str

    model_config = {"extra": "forbid"}
