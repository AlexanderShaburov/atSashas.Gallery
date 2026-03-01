// shared/lib/checkers/eventStatusHelpers.ts

import type { EventData } from '@/entities/event';

export function isEventClosed(event: EventData): boolean {
    return event.status === 'closed';
}

export function isEventDraft(event: EventData): boolean {
    return event.status === 'draft';
}

export function canEnrollEvent(event: EventData): boolean {
    return !isEventClosed(event) && !isEventDraft(event);
}

export function isEventFree(event: EventData): boolean {
    return !event.price || event.price.amount <= 0;
}
