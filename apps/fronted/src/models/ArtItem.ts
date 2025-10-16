import type {
  ArtItemJSON,
  Availability,
  Dimensions,
  ImagesJSON,
  ISODate,
  Localized,
  Money,
} from '@/features/gallery/types';
import { Tags } from './Tags';

export interface ArtItemInit {
  id: string;
  title: Localized;
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
  title: Localized;
  dateCreated: ISODate;
  techniques: string[];
  price: Money | null;
  availability: Availability;
  series: string | null;
  tags: Tags;
  notes: string | null;
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
    this.price = data.price ?? null;
    this.availability = data.availability;
    this.series = data.series ?? null;
    this.tags = new Tags(data.tags ?? []);
    this.notes = data.notes ?? null;
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
      tags: this.tags.toArray(),
      notes: this.notes,
      images: {
        alt: this.images.alt,
        preview: this.images.preview,
        full: this.images.full,
      },
    };
  }
}
