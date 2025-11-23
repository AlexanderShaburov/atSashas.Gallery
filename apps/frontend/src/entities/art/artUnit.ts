// src/entities/art/artUnit.ts

import type { ImagesJSON } from '@/entities/art/images';
import type { Availability, Dimensions, ISODate, Localized, Money } from '@/entities/common';

export interface ArtItemData {
    id: string;
    title?: Localized;
    dateCreated: ISODate;
    techniques: string[];
    availability: Availability;
    price?: Money;
    series?: string;
    tags: string[];
    notes?: string;
    alt?: Localized;
    images: ImagesJSON;
    dimensions: Dimensions;
}

export const ITEM_MODE = ['create', 'edit'] as const;
export type ItemMode = (typeof ITEM_MODE)[number];
