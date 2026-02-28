// features/admin/eventEditor/api/eventsAdminApi.ts

import type { EventCatalog, EventData } from '@/entities/event';
import { eventsStore } from '@/shared/state/domain';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const EVENTS_URL = `${API_BASE}/admin/events`;

export type CreateEventPayload = Omit<EventData, 'id'>;

export const eventsAdminApi = {
  async getAll(): Promise<EventCatalog> {
    const res = await fetch(EVENTS_URL);
    if (!res.ok) throw new Error(`Failed to load events: ${res.statusText}`);
    return res.json();
  },

  async create(payload: CreateEventPayload): Promise<EventData> {
    const res = await fetch(EVENTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create event: ${text}`);
    }
    return res.json();
  },

  async update(id: string, event: EventData): Promise<EventData> {
    const res = await fetch(`${EVENTS_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to update event: ${text}`);
    }
    return res.json();
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`${EVENTS_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to delete event: ${text}`);
    }
  },
};

/** Fetch events from API and write to external store */
export async function refreshEvents(): Promise<void> {
    try {
        const catalog = await eventsAdminApi.getAll();
        eventsStore.set(catalog);
    } catch (error) {
        console.error('Failed to refresh events:', error);
    }
}
