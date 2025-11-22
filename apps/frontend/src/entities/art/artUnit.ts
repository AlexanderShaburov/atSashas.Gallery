import type { ImagesJSON } from '@/entities/art/images';
import type { Availability, Dimensions, ISODate, Localized, Money } from '@/entities/common';
import { Thumb } from '../catalog';
import { ArtItem } from './ArtItem';

export const ITEM_TYPE = ['create', 'edit'];
export type ItemType = (typeof ITEM_TYPE)[number];

export interface ArtItemJSON {
    id: string;
    title?: Localized;
    dateCreated: ISODate;
    techniques: string[];
    price?: Money | undefined;
    availability?: Availability;
    series?: string | undefined;
    tags: string[];
    alt: Localized | undefined;
    notes?: string | undefined;
    images: ImagesJSON;
    dimensions?: Dimensions;
}
export interface DraftArtItemJSON {
    id?: string;
    title?: Localized;
    dateCreated: ISODate;
    techniques: string[];
    price?: Money | undefined;
    availability?: Availability;
    series?: string | undefined;
    tags?: string[];
    notes?: string | undefined;
    hopperImage: string;
    dimensions?: Dimensions;
}
export type ArtGerm = {
    mode: 'create' | 'edit';
    item: Thumb | ArtItem;
};
