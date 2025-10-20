import { ArtItemJSON } from '@/entities/art';

export type ArtCatalog = {
    catalogVersion: number;
    updatedAt: string;
    order: string[];
    items: Record<string, ArtItemJSON>;
};

export type HopperThumb = {
    id: string;
    url: string;
};
