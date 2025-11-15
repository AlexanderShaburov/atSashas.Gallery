from dataclasses import dataclass
from locale import normalize
from typing import Union

from models.art_item import ArtItem


@dataclass
class ImagesJSON:
    full: str
    previews: list[str]

    @classmethod
    def from_hopper(cls, hopper_src: str) -> "ImagesJSON":
         """
        Create ImagesJSON automatically generating preview paths from full.
        Example: "vault/arts/full/image.jpg" → previews ["s_image.jpg", "m_image.jpg", "l_image.jpg"]
        """
        return normalized(hopper_crc)
         


@dataclass
class HopperImageShipment:
    kind: str  # Always 'hopper';
    hopperSrc: str


@dataclass
class ReadyImageShipment:
    kind: str  # Always 'ready'
    images: ImagesJSON


UnitedImages = Union[HopperImageShipment, ReadyImageShipment]


class ImagesShipment:
    def __ini__(
        self,
        id: str,
        dateCreated: str,
        techniques: list[str],
        availability: str,
        dimensions: dict,
        images: UnitedImages,
        title=None,
        price=None,
        series=None,
        tags=None,
        notes=None,
    ):
        self.id = id
        self.dateCreated = dateCreated
        self.techniques = techniques
        self.availability = availability
        self.dimensions = dimensions
        self.images = images
        self.title = title
        self.price = price
        self.series = series
        self.tags = tags
        self.notes = notes

    def normalize_images(self):
        if self.images.kind == "hopper":

