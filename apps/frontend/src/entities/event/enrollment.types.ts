// entities/event/enrollment.types.ts
//
// Shared types for event status, payment status, and registration records.
// Relocated from `event.types.ts` during the EventPage canonicalization
// migration (see knowledge/plans/plan--event--collapse-into-event-page.md
// Phase 5). These types survive the retirement of the legacy `EventData`
// model because they are consumed by the canonical `EventPageData`.

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
