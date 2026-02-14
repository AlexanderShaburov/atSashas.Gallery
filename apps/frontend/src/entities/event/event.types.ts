// entities/event/event.types.ts

import type { Localized, Money } from '@/entities/common';

export const EVENT_STATUSES = ['draft', 'scheduled', 'closed'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface EventData {
    id: string;
    slug: string;
    title: Localized;
    description?: Localized;
    dateTime: string;
    durationMinutes?: number;
    location: string;
    price?: Money;
    status: EventStatus;
    streamSlug?: string;
}
