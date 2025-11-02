import { ArtItemJSON } from '@/entities/art';

export type ArtCatalog = {
    catalogVersion: number;
    updatedAt: string;
    order: string[];
    items: Record<string, ArtItemJSON>;
};

export type Thumb = {
    id: string;
    src: string;
    alt?: string;
};

export type EditorIdentity = { mode: 'create' | 'edit'; id: string };
