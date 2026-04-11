// features/admin/mediaEditor/logic/filterMediaItems.ts

import type { EntityLifecycle } from '@/entities/common';
import type { MediaItemData, MediaItemKind } from '@/entities/mediaItem';

export interface MediaFilterState {
  kind?: MediaItemKind;
  lifecycle?: EntityLifecycle;
  tag?: string;
  search?: string;
}

export function filterMediaItems(
  items: MediaItemData[],
  filter: MediaFilterState,
): MediaItemData[] {
  const { kind, lifecycle, tag, search } = filter;
  const searchLower = search?.trim().toLowerCase();

  return items.filter((item) => {
    if (kind && item.media.kind !== kind) return false;
    if (lifecycle && item.lifecycle !== lifecycle) return false;
    if (tag && (!item.tags || !item.tags.includes(tag))) return false;
    if (searchLower) {
      const titleMatch = Object.values(item.title ?? {}).some((v) =>
        v?.toLowerCase().includes(searchLower),
      );
      const altMatch = Object.values(item.alt ?? {}).some((v) =>
        v?.toLowerCase().includes(searchLower),
      );
      const idMatch = item.id.toLowerCase().includes(searchLower);
      if (!titleMatch && !altMatch && !idMatch) return false;
    }
    return true;
  });
}
