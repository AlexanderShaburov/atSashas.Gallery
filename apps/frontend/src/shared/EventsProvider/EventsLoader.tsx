// shared/EventsProvider/EventsLoader.tsx

import type { EventCatalog } from '@/entities/event';
import { invalidateEventsCache, loadEventsOnce } from '@/features/public/api/eventsModule';
import { useCallback, useEffect, useState } from 'react';
import { EventsProvider } from './EventsProvider';

export function EventsLoader({ children }: { children: React.ReactNode }) {
    const [catalog, setCatalog] = useState<EventCatalog | null>(null);

    const load = useCallback(() => {
        loadEventsOnce()
            .then((data) => setCatalog(data))
            .catch(console.error);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const refreshEvents = useCallback(async () => {
        invalidateEventsCache();
        try {
            const data = await loadEventsOnce();
            setCatalog(data);
        } catch (err) {
            console.error('[EventsLoader] refresh failed', err);
        }
    }, []);

    // Non-blocking: render children even while loading (context will be undefined)
    return (
        <EventsProvider catalog={catalog ?? undefined} refreshEvents={refreshEvents}>
            {children}
        </EventsProvider>
    );
}
