// features/public/api/mediaItemsModule.ts

import type { MediaItemCatalog, MediaItemData } from '@/entities/mediaItem';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const MEDIA_ITEMS_URL = `${API_BASE}/public/media-items`;

let cache: MediaItemCatalog | null = null;
let inflight: Promise<MediaItemCatalog> | null = null;

export async function loadMediaItemsOnce(): Promise<MediaItemCatalog> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(MEDIA_ITEMS_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`MediaItems HTTP ${res.status}`);
      const data = (await res.json()) as MediaItemCatalog;
      cache = data;
      return data;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function getMediaItem(id: string): MediaItemData | undefined {
  return cache?.items?.[id];
}

export function invalidateMediaItemsCache(): void {
  cache = null;
  inflight = null;
}
