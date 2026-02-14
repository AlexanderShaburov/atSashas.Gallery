// shared/EventsProvider/EventsProvider.tsx

import type { EventCatalog } from '@/entities/event';
import { createContext, useContext } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const EventsContext = createContext<EventCatalog | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const EventsRefreshContext = createContext<(() => Promise<void>) | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useRefreshEvents(): () => Promise<void> {
    const refresh = useContext(EventsRefreshContext);
    if (!refresh) throw new Error('useRefreshEvents must be used within EventsLoader');
    return refresh;
}

export function EventsProvider({
    catalog,
    refreshEvents,
    children,
}: {
    catalog?: EventCatalog;
    refreshEvents?: () => Promise<void>;
    children: React.ReactNode;
}) {
    return (
        <EventsContext.Provider value={catalog}>
            <EventsRefreshContext.Provider value={refreshEvents}>
                {children}
            </EventsRefreshContext.Provider>
        </EventsContext.Provider>
    );
}
