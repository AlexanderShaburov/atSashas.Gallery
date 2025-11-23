// src/entities/catalog/catalog.ts

import type { ArtItemData, ItemMode } from '@/entities/art/artUnit';

export interface ArtCatalog {
    catalogVersion: number;
    updatedAt: string;
    order: string[];
    items: Record<string, ArtItemData>;
}

export type EditorIdentity = {
    mode: ItemMode;
    id: string;
};
