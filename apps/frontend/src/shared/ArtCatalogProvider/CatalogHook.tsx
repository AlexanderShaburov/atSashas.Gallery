import { ArtItemData } from '@/entities/art';
import { ArtCatalog } from '@/entities/catalog';
import { ArtCatalogContext } from '@/shared/ArtCatalogProvider/ArtCatalogProvider';
import { useContext } from 'react';

export function useArtCatalog(): ArtCatalog {
    const ctx = useContext(ArtCatalogContext);
    if (!ctx) {
        throw new Error('useArtCatalog must be used within ArtCatalogProvider');
    }
    return ctx;
}

export type ResolveArt = (id: string) => ArtItemData | undefined;

export function useResolveArt(): ResolveArt {
    const catalog = useArtCatalog();
    return (artId: string) => catalog.items[artId];
}
