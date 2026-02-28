// src/shared/ui/grid/gridItem.ts
import { PreviewPath } from '@/entities/art';

export interface GridItemSources {
    avif?: PreviewPath;
    webp?: PreviewPath;
    jpeg?: PreviewPath;
}

export interface GridItem {
    id: string;
    thumbUrl: string;
    sources?: GridItemSources;
    title?: string;
    badge?: string;
}

export interface ArtItemGridItem {
    id: string;
    thumbUrl: string;
    fileName?: string;
}

export interface CatalogGridItem {
    id: string;
    thumbUrl: string;
    title?: string;
    badge?: string;
}
