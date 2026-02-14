// shared/EventsProvider/useEvent.ts

import type { EventData } from '@/entities/event';
import { useContext } from 'react';
import { EventsContext } from './EventsProvider';

export function useEvent(eventId: string | undefined): EventData | undefined {
    const catalog = useContext(EventsContext);
    if (!eventId || !catalog) return undefined;
    return catalog.events[eventId];
}
