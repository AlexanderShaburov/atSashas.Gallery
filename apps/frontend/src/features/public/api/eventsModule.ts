// features/public/api/eventsModule.ts

import type { EventCatalog } from '@/entities/event';
import type { EventData } from '@/entities/event';

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
