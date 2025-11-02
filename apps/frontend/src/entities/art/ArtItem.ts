import type { Dimensions, Availability } from '../common/';
import type { ImagesJSON, PriceJSON } from './';
import { Tags } from '@/entities/common/Tags';
import { ArtItemJSON } from '@/entities/art';
import { ISODate, Localized, Money } from '@/entities/common';

export interface ArtItemDraft {
    id: string;
    images: ImagesJSON; // хотя бы 1 файл
    status: 'draft';
    createdAt: string; // авто: new Date().toISOString()
    catalogVersion: number;
    updatedAt: string; // авто
    // всё остальное — необязательно на этом этапе:
    title?: Localized;
    dateCreated?: ISODate; // YYYY-MM-DD реальной работы (может быть не известна сразу)
    techniques?: string[]; // позже соберём из category+technique
    dimensions?: Dimensions;
    availability?: Availability; // по умолчанию не знаем
    price?: PriceJSON | null;
    series?: string | null;
    tags?: string[];
    notes?: string | null;
    alt?: Localized;
}

export interface ArtItemInit {
    id: string;
    title?: Localized;
    dateCreated: ISODate;
    techniques: string[];
    dimensions: Dimensions;
    price?: Money | null;
    availability: Availability;
    series?: string | null;
    tags?: string[];
    notes?: string | null;
    images: ImagesJSON;
}

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

    constructor(data: ArtItemInit) {
        if (!/^\w/.test(data.id)) throw new Error('Work.id is required');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateCreated)) {
            throw new Error('dateCreated must be ISO YYYY-MM-DD');
        }
        if (!['cm', 'in'].includes(data.dimensions.unit)) {
            throw new Error('dimensions.unit must be "cm" or "in"');
        }

        this.id = data.id;
        this.title = data.title;
        this.dateCreated = data.dateCreated;
        this.techniques = data.techniques;
        this.dimensions = data.dimensions;
        this.price = data.price ?? undefined;
        this.availability = data.availability;
        this.series = data.series ?? undefined;
        this.tags = [];
        this.notes = data.notes ?? undefined;
        this.images = data.images;
    }

    static fromJSON(key: string, json: ArtItemJSON): ArtItem {
        const init: ArtItemInit = {
            id: json.id ?? key,
            title: json.title ?? {},
            dateCreated: json.dateCreated,
            techniques: json.techniques ?? [],
            dimensions: json.dimensions,
            price: json.price ? { amount: json.price.amount, currency: json.price.currency } : null,
            availability: json.availability,
            series: json.series ?? null,
            tags: json.tags ?? [],
            notes: json.notes ?? null,
            images: {
                alt: json.images?.alt ?? {},
                preview: json.images?.preview ?? {},
                full: json.images.full!,
            },
        };
        return new ArtItem(init);
    }

    toJSON(): ArtItemJSON {
        return {
            id: this.id,
            title: this.title,
            dateCreated: this.dateCreated,
            techniques: this.techniques,
            dimensions: this.dimensions,
            price: this.price,
            availability: this.availability,
            series: this.series,
            tags: this.tags,
            notes: this.notes,
            images: {
                alt: this.images.alt,
                preview: this.images.preview,
                full: this.images.full,
            },
        };
    }
}
