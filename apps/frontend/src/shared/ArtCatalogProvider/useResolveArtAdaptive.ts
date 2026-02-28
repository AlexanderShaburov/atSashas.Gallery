// src/shared/ArtCatalogProvider/useResolveArtAdaptive.ts
import { ArtItemData } from '@/entities/art';
import { useResolveArt } from '@/shared/ArtCatalogProvider/CatalogHook';
import { catalogStore, useStoreData } from '@/shared/state';

export type ResolveArt = (id: string) => ArtItemData | undefined;

/**
 * Adaptive hook that resolves art items from the correct catalog source:
 * - In admin/editor context: uses catalogStore (external store, dynamically updated)
 * - In public context: uses ArtCatalogContext (static, loaded once)
 *
 * This fixes the issue where newly created art items weren't visible in the Block editor
 * because GalleryComponent was reading from the stale ArtCatalogContext instead of the
 * updated catalog store.
 */
export function useResolveArtAdaptive(): ResolveArt {
    // Read from external catalog store (populated in admin area by AdminDataPreloader)
    const storeCatalog = useStoreData(catalogStore);

    // Fallback: public catalog context (from ArtCatalogLoader)
    const publicResolveArt = useResolveArt();

    // If store has catalog data, use that (it's dynamically updated)
    if (storeCatalog) {
        return (artId: string) => storeCatalog.items[artId];
    }

    // Otherwise use public catalog (public pages or store not populated yet)
    return publicResolveArt;
}
