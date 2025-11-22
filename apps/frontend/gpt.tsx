export class ArtItem {
    readonly id: string;
    title: Localized | undefined;
    dateCreated: ISODate;
    techniques: string[];
    price: Money | undefined;
    availability: Availability;
    series: string | undefined;
    tags: string[];
    alt: Localized | undefined;
    notes: string | undefined;
    images: ImagesJSON;
    dimensions: Dimensions;

    constructor(data: {
        id: string;
        title?: Localized;
        dateCreated: ISODate;
        techniques: string[];
        price?: Money;
        availability: Availability;
        series?: string;
        tags?: string[];
        alt?: Localized;
        notes?: string;
        images: ImagesJSON;
        dimensions: Dimensions;
    }) {
        this.id = data.id;
        this.title = data.title;
        this.dateCreated = data.dateCreated;
        this.techniques = data.techniques;
        this.price = data.price;
        this.availability = data.availability;
        this.series = data.series;
        this.tags = data.tags ?? []; // normalize to []
        this.alt = data.alt;
        this.notes = data.notes;
        this.images = data.images;
        this.dimensions = data.dimensions;
    }

    static fromJSON(json: ArtItemJSON): ArtItem {
        return new ArtItem({
            ...json,
            tags: json.tags ?? [], // ensure not undefined
            // alt: можно сюда подтащить из images.alt, если она там есть
            // alt: json.images.alt,
        });
    }
}
