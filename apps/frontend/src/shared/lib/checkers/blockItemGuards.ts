import type { GalleryArtItem, GalleryBlockItem } from '@/entities/block';

export function isArtItem(item: GalleryBlockItem): item is GalleryArtItem {
    return !('kind' in item) || item.kind === 'art';
}
