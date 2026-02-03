// src/entities/art/artUnit.ts

import type { ImagesJSON } from '@/entities/art/images';
import type {
    Availability,
    Dimensions,
    EntityLifecycle,
    ISODate,
    Localized,
    Money,
} from '@/entities/common';

export interface ArtItemData {
    id: string;
    dateCreated: ISODate;
    title: Localized | undefined;
    techniques: string[];
    availability: Availability;
    dimensions: Dimensions;
    price: Money | undefined;
    alt: Localized | undefined;
    series: string | undefined;
    tags: string[];
    notes: string | undefined;
    images: ImagesJSON;
    lifecycle: EntityLifecycle;
}

export const ITEM_MODE = ['create', 'edit'] as const;
export type ItemMode = (typeof ITEM_MODE)[number];
