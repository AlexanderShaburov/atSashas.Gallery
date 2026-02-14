// shared/EventsProvider/EventsProvider.tsx

import type { EventCatalog } from '@/entities/event';
import { createContext } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const EventsContext = createContext<EventCatalog | undefined>(undefined);

export function EventsProvider({
    catalog,
    children,
}: {
    catalog?: EventCatalog;
    children: React.ReactNode;
}) {
    return <EventsContext.Provider value={catalog}>{children}</EventsContext.Provider>;
}
