// entities/event/enrollment.types.ts
//
// Shared types for event status, enrollment process status, payment status,
// and enrollment records. Mirrors the backend Pydantic model in
// `apps/admin-backend/app/models/enrollments.py` (Phase 1 of
// knowledge/plans/plan--admin--event-enrollments-management.md).
//
// Legacy paymentStatus values ('pending', 'failed') that may appear on
// pre-Phase-1 stored records are coerced to 'unpaid' on the backend before
// they reach the wire. The frontend therefore sees the reduced dual-state
// payment model.

export const EVENT_STATUSES = ['draft', 'scheduled', 'closed'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const PAYMENT_STATUSES = ['unpaid', 'paid'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ENROLLMENT_STATUSES = [
    'pending',
    'confirmed',
    'cancelled_by_user',
    'cancelled_by_admin',
    'no_show',
    'attended',
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const ENROLLMENT_CREATED_BY = ['public', 'admin'] as const;
export type EnrollmentCreatedBy = (typeof ENROLLMENT_CREATED_BY)[number];

export interface Enrollment {
    id: string;
    fullName: string;
    // Phase 2 made email/phone individually optional — at least one is
    // enforced at the request layer (backend `EnrollRequest`).
    email?: string;
    phone?: string;
    note?: string;
    status: EnrollmentStatus;
    paymentStatus: PaymentStatus;
    createdBy: EnrollmentCreatedBy;
    createdAt: string;
    updatedAt: string;
    stripeSessionId?: string;
}
