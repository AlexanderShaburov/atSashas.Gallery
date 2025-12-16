import { ISODate } from '@/entities/common';
import { Block } from './Block';

export interface BlocksCollectionJSON {
    kind: 'BlockCollection';
    collectionId: string; // stable id of this block catalog (for routing, references, etc.)
    collectionName: string; // human readable name, may be shown in admin UI
    version: number; // simple integer, increment on breaking changes if needed
    generatedAt: ISODate;
    updatedAt: ISODate; // or just string
    blocks: Record<string, Block>; // exactly your union: GalleryBlock | TextBlock | CtaBlock
    order: string[];
}
