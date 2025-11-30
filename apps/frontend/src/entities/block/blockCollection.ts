import { ISODate } from '@/entities/common';
import { Block } from './Block';

export interface BlocksCollectionJSON {
    collectionId: string; // stable id of this block catalog (for routing, references, etc.)
    collectionName: string; // human readable name, may be shown in admin UI
    version: number; // simple integer, increment on breaking changes if needed
    updatedAt: ISODate; // or just string
    blocks: Block[]; // exactly your union: GalleryBlock | TextBlock | CtaBlock
}

export interface CollectionsListItem {
    id: string;
    url: string;
    name: string;
    length: number;
}
export type CollectionsList = CollectionsListItem[];
