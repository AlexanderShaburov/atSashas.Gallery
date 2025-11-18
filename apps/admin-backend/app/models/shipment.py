from typing import Literal, Union, Annotated, Optional, List
from pydantic import BaseModel, Field

from app.models.images_pipline import ImagesJSON
from .common import Availability, Dimensions, ISODate, Localized, Money


class HopperImageShipment(BaseModel):
    kind: Literal["hopper"]
    hopperSrc: str


class ReadyImageShipment(BaseModel):
    kind: Literal["ready"]
    image: ImagesJSON


ImageShipment = Annotated[
    Union[HopperImageShipment, ReadyImageShipment], Field(discriminator="kind")
]


class ArtShipmentModel(BaseModel):
    id: str
    dateCreated: ISODate
    title: Optional[Localized] = None
    techniques: Optional[List[str]] = None
    availability: Optional[Availability] = None
    dimensions: Optional[Dimensions] = None
    price: Optional[Money] = None
    alt: Optional[Localized] = None
    series: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    images: ImageShipment
