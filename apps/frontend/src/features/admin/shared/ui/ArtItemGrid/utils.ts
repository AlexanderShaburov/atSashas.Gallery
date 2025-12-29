import { ArtItemData } from '@/entities/art';
import { GridItem } from '@/entities/grid';

export function artItemToGridItem(a: ArtItemData): GridItem {
    const thumbUrl = a.images.full as string;
    return {
        id: a.id,
        thumbUrl: thumbUrl,
        title: a.title?.en ?? a.title?.ru ?? '',
    };
}
