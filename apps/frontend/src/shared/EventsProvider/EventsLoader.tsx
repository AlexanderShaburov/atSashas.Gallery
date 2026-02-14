// shared/EventsProvider/EventsLoader.tsx

import type { EventCatalog } from '@/entities/event';
import { loadEventsOnce } from '@/features/public/api/eventsModule';
import { useEffect, useState } from 'react';
import { EventsProvider } from './EventsProvider';

export function EventsLoader({ children }: { children: React.ReactNode }) {
    const [catalog, setCatalog] = useState<EventCatalog | null>(null);

    useEffect(() => {
        let mounted = true;
        loadEventsOnce()
            .then((data) => {
                if (mounted) setCatalog(data);
            })
            .catch(console.error);
        return () => {
            mounted = false;
        };
    }, []);

    // Non-blocking: render children even while loading (context will be undefined)
    return <EventsProvider catalog={catalog ?? undefined}>{children}</EventsProvider>;
}
