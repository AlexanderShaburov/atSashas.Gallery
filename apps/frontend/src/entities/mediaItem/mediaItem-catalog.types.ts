// entities/mediaItem/mediaItem-catalog.types.ts

import type { MediaItemData } from './mediaItem.types';

export interface MediaItemCatalog {
  version: number;
  updatedAt: string;
  order: string[];
  items: Record<string, MediaItemData>;
}
