// features/admin/enrollments/actionRules.ts
//
// Frontend mirror of the Phase 5A backend transition graph. The backend
// remains the source of truth (enforced by
// `apps/admin-backend/app/routers/enrollments/enrollments.py`); these
// helpers only gate the menu rendering so admins don't see options that
// would return 409.

import type { Enrollment, EnrollmentStatus } from '@/entities/event';

export const TERMINAL_STATUSES: ReadonlySet<EnrollmentStatus> = new Set([
    'cancelled_by_user',
    'cancelled_by_admin',
    'no_show',
    'attended',
]);

const LEGAL_TRANSITIONS: Readonly<Record<EnrollmentStatus, readonly EnrollmentStatus[]>> = {
    pending: ['confirmed', 'cancelled_by_user', 'cancelled_by_admin'],
    confirmed: ['attended', 'no_show', 'cancelled_by_admin'],
    cancelled_by_user: [],
    cancelled_by_admin: [],
    attended: [],
    no_show: [],
};

export function legalNextStatuses(current: EnrollmentStatus): readonly EnrollmentStatus[] {
    return LEGAL_TRANSITIONS[current] ?? [];
}

export function isTerminalStatus(status: EnrollmentStatus): boolean {
    return TERMINAL_STATUSES.has(status);
}

export function canTransfer(enrollment: Pick<Enrollment, 'status'>): boolean {
    return !isTerminalStatus(enrollment.status);
}

export function humanEnrollmentStatus(status: EnrollmentStatus): string {
    switch (status) {
        case 'pending':
            return 'Pending';
        case 'confirmed':
            return 'Confirmed';
        case 'cancelled_by_user':
            return 'Cancelled (user)';
        case 'cancelled_by_admin':
            return 'Cancelled (admin)';
        case 'no_show':
            return 'No-show';
        case 'attended':
            return 'Attended';
        default:
            return status;
    }
}
