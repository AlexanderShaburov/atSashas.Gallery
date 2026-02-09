import { ArtCatalogContext } from '@/shared/ArtCatalogProvider/ArtCatalogProvider';
import { useContext } from 'react';
export function useArtCatalog() {
    const ctx = useContext(ArtCatalogContext);
    if (!ctx) {
        throw new Error('useArtCatalog must be used within ArtCatalogProvider');
    }
    return ctx;
}
export function useResolveArt() {
    const catalog = useArtCatalog();
    return (artId) => catalog.items[artId];
}
