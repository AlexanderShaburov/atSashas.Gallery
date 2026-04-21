// features/public/api/eventPagesModule.ts

import type { EventPageData } from '@/entities/event';

interface EventPageCatalogJSON {
    version: number;
    updatedAt: string;
    pages: Record<string, EventPageData>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const EVENT_PAGES_URL = `${API_BASE}/public/event-pages`;

let cache: EventPageCatalogJSON | null = null;
let inflight: Promise<EventPageCatalogJSON> | null = null;

export async function loadEventPagesOnce(): Promise<EventPageCatalogJSON> {
    if (cache) return cache;
    if (inflight) return inflight;

    inflight = (async () => {
        try {
            const res = await fetch(EVENT_PAGES_URL, { cache: 'no-store' });
            if (!res.ok) throw new Error(`EventPages HTTP ${res.status}`);
            const data = (await res.json()) as EventPageCatalogJSON;
            cache = data;
            return data;
        } finally {
            inflight = null;
        }
    })();
    return inflight;
}

export function getEventPageByEventId(eventId: string): EventPageData | undefined {
    if (!cache) return undefined;
    for (const page of Object.values(cache.pages)) {
        if (page.eventId === eventId) return page;
    }
    return undefined;
}

/**
 * Direct lookup by EventPageData.id (canonical path).
 * Used by HomeEventTile and the Homepage Editor; does not resolve via legacy eventId.
 */
export function getEventPageById(eventPageId: string): EventPageData | undefined {
    if (!cache) return undefined;
    return cache.pages[eventPageId];
}

export function invalidateEventPagesCache(): void {
    cache = null;
    inflight = null;
}
