import type { ImagesJSON } from '@/entities/art/images';
import type { ISODate, Localized } from '@/entities/common';
import type { Availability, Dimensions } from '@/entities/common/dimensions';
import type { CurrencyName } from '@/entities/common/money';
import { Thumb } from '../catalog';
import { ArtItem } from './ArtItem';

export interface PriceJSON {
    amount: number;
    currency: CurrencyName;
}

export const ITEM_TYPE = ['create', 'edit'];
export type ItemType = (typeof ITEM_TYPE)[number];

export interface ArtItemJSON {
    id?: string;
    title?: Localized;
    dateCreated: ISODate;
    techniques: string[];
    price?: PriceJSON | null;
    availability: Availability;
    series?: string | null;
    tags?: string[];
    notes?: string | null;
    images: ImagesJSON;
    dimensions: Dimensions;
}
export interface DraftArtItemJSON {
    id?: string;
    title?: Localized;
    dateCreated: ISODate;
    techniques: string[];
    price?: PriceJSON | undefined;
    availability: Availability;
    series?: string | null;
    tags?: string[];
    notes?: string | null;
    hopperImage: string;
    dimensions: Dimensions;
}
export type ArtGerm = {
    mode: 'create' | 'edit';
    item: Thumb | ArtItem;
};
