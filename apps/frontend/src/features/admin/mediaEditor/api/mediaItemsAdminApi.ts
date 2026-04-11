// features/admin/mediaEditor/api/mediaItemsAdminApi.ts

import type { MediaItemCatalog, MediaItemData } from '@/entities/mediaItem';
import { mediaItemsStore } from '@/shared/state/domain';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const MEDIA_ITEMS_URL = `${API_BASE}/admin/media-items`;

export type CreateMediaItemPayload = Omit<MediaItemData, 'id'>;

export const mediaItemsAdminApi = {
  async getAll(): Promise<MediaItemCatalog> {
    const res = await fetch(MEDIA_ITEMS_URL);
    if (!res.ok) throw new Error(`Failed to load media items: ${res.statusText}`);
    return res.json();
  },

  async create(payload: CreateMediaItemPayload): Promise<MediaItemData> {
    const res = await fetch(MEDIA_ITEMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create media item: ${text}`);
    }
    return res.json();
  },

  async update(id: string, item: MediaItemData): Promise<MediaItemData> {
    const res = await fetch(`${MEDIA_ITEMS_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to update media item: ${text}`);
    }
    return res.json();
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`${MEDIA_ITEMS_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to delete media item: ${text}`);
    }
  },
};

/** Fetch media items from API and write to external store */
export async function refreshMediaItems(): Promise<void> {
  try {
    const catalog = await mediaItemsAdminApi.getAll();
    mediaItemsStore.set(catalog);
  } catch (error) {
    console.error('Failed to refresh media items:', error);
  }
}
