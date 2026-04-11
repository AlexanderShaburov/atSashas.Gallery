// features/admin/mediaEditor/logic/newMediaItemFromHopperLoot.ts

import type { MediaItemData } from '@/entities/mediaItem';
import type { GridItem } from '@/shared/ui/grid';
import { todayISO } from '@/shared/lib/dateAndLabels/today';
import { generateId } from '@/shared/lib/id/generateId';

/**
 * Creates a new draft MediaItemData from a Hopper grid item (uploaded image).
 * Follows the same pattern as `newArtItemFromGrid` in the catalog editor.
 */
export function newMediaItemFromHopperLoot(item: GridItem): MediaItemData {
  return {
    id: generateId('media'),
    lifecycle: 'draft',
    dateCreated: todayISO(),
    media: {
      kind: 'image',
      sources: {
        preview: {},
        full: item.thumbUrl,
      },
    },
    title: item.title ? { en: item.title } : undefined,
    alt: undefined,
    dimensions: undefined,
    tags: [],
  };
}
