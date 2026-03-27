import type { EventCatalog } from '@/entities/event';
import type { EventData } from '@/entities/event';
import { eventsStore } from '@/shared/state';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const EVENTS_URL = `${API_BASE}/public/events`;

let eventsCatalogCache: EventCatalog | null = null;
let inflight: Promise<EventCatalog> | null = null;

export async function loadEventsOnce(): Promise<EventCatalog> {
    if (eventsCatalogCache) return eventsCatalogCache;
    if (inflight) return inflight;

    inflight = (async () => {
        try {
            const res = await fetch(EVENTS_URL, { cache: 'no-store' });
            if (!res.ok) throw new Error(`Events HTTP ${res.status}`);
            const data = (await res.json()) as EventCatalog;
            eventsCatalogCache = data;
            eventsStore.set(data);
            return data;
        } finally {
            inflight = null;
        }
    })();
    return inflight;
}

export function getEvent(id: string): EventData | undefined {
    return eventsCatalogCache?.events?.[id];
}

export function invalidateEventsCache(): void {
    eventsCatalogCache = null;
    inflight = null;
}

/** Invalidate cache, re-fetch, and update the external store. */
export async function refreshEventsStore(): Promise<void> {
    invalidateEventsCache();
    await loadEventsOnce();
}
