// entities/event/event-catalog.types.ts

import type { EventData } from './event.types';

export interface EventCatalog {
    version: number;
    updatedAt: string;
    events: Record<string, EventData>;
}
