from models.art_shipment import ImagesJSON


class ArtItem:
    def __ini__(
        self,
        id: str,
        dateCreated: str,
        techniques: list[str],
        availability: str,
        dimensions: dict,
        images: ImagesJSON,
        title=None,
        price=None,
        series=None,
        tags=None,
        notes=None,
    ):
        pass
