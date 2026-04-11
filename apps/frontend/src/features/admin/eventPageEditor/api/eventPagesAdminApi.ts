import type { EventPageData } from '@/entities/event';
import { eventPagesStore } from '@/shared/state';
import type { EventPageCatalog } from '@/shared/state';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const URL = `${API_BASE}/admin/event-pages`;

export const eventPagesAdminApi = {
  async getAll(): Promise<EventPageCatalog> {
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`Failed to load event pages: ${res.statusText}`);
    return res.json();
  },

  async create(page: EventPageData): Promise<EventPageData> {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create event page: ${text}`);
    }
    return res.json();
  },

  async update(id: string, page: EventPageData): Promise<EventPageData> {
    const res = await fetch(`${URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to update event page: ${text}`);
    }
    return res.json();
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`${URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to delete event page: ${text}`);
    }
  },
};

export async function refreshEventPages(): Promise<void> {
  try {
    const catalog = await eventPagesAdminApi.getAll();
    eventPagesStore.set(catalog);
  } catch (error) {
    console.error('Failed to refresh event pages:', error);
  }
}
