// entities/event/event.types.ts

import type { Localized, Money } from '@/entities/common';

export const EVENT_STATUSES = ['draft', 'scheduled', 'closed'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Enrollment {
    id: string;
    fullName: string;
    email: string;
    createdAt: string;
    paymentStatus: PaymentStatus;
    stripeSessionId?: string;
}

export interface EventData {
    id: string;
    slug: string;
    title: Localized;
    description?: Localized;
    dateTime: string;
    durationMinutes?: number;
    location: string;
    mapUrl?: string;
    price?: Money;
    status: EventStatus;
    streamSlug?: string;
    enrollments?: Record<string, Enrollment>;
}
