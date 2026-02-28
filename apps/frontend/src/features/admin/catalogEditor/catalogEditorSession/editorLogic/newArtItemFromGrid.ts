import type { ArtItemData } from '@/entities/art';
import type { ImagesJSON } from '@/entities/art/images';
import type { GridItem } from '@/shared/ui/grid';
import { todayISO } from '@/shared/lib/dateAndLabels/today';
import { generateId } from '@/shared/lib/id/generateId';

export function newArtItemFromGrid(item: GridItem): ArtItemData {
    const full = item.thumbUrl as ImagesJSON['full'];

    return {
        id: generateId('art'),
        dateCreated: todayISO(),
        title: item.title ? { en: item.title } : undefined,
        techniques: [],
        availability: 'available',
        dimensions: {
            width: 0,
            height: 0,
            unit: 'cm',
        },
        price: undefined,
        alt: undefined,
        series: undefined,
        tags: [],
        notes: undefined,
        images: {
            alt: {},
            preview: {},
            full,
        },
        lifecycle: 'draft',
    };
}
