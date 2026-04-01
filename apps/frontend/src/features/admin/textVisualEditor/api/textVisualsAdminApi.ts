// features/admin/textVisualEditor/api/textVisualsAdminApi.ts

import type { TextVisualCatalog, TextVisualData } from '@/entities/textVisual';
import { textVisualsStore } from '@/shared/state/domain';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TEXT_VISUALS_URL = `${API_BASE}/admin/text-visuals`;

export type CreateTextVisualPayload = Omit<TextVisualData, 'id'>;

export const textVisualsAdminApi = {
  async getAll(): Promise<TextVisualCatalog> {
    const res = await fetch(TEXT_VISUALS_URL);
    if (!res.ok) throw new Error(`Failed to load text visuals: ${res.statusText}`);
    return res.json();
  },

  async create(payload: CreateTextVisualPayload): Promise<TextVisualData> {
    const res = await fetch(TEXT_VISUALS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create text visual: ${text}`);
    }
    return res.json();
  },

  async update(id: string, item: TextVisualData): Promise<TextVisualData> {
    const res = await fetch(`${TEXT_VISUALS_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to update text visual: ${text}`);
    }
    return res.json();
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`${TEXT_VISUALS_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to delete text visual: ${text}`);
    }
  },
};

/** Fetch text visuals from API and write to external store */
export async function refreshTextVisuals(): Promise<void> {
  try {
    const catalog = await textVisualsAdminApi.getAll();
    textVisualsStore.set(catalog);
  } catch (error) {
    console.error('Failed to refresh text visuals:', error);
  }
}
