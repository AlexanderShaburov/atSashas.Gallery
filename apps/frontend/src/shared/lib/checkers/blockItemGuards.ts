import type { GalleryArtItem, GalleryBlockItem, GalleryEventItem } from '@/entities/block';

export function isArtItem(item: GalleryBlockItem): item is GalleryArtItem {
    return !('kind' in item) || item.kind === 'art';
}

export function isEventItem(item: GalleryBlockItem): item is GalleryEventItem {
    return 'kind' in item && item.kind === 'eventCta';
}
