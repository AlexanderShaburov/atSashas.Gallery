// features/admin/enrollments/summary.ts
//
// Pure count derivation for the admin enrollments detail summary strip.
// Rules mirror the plan §Phase 4 / §3 counting semantics:
//
//   totalCount     = all enrollments
//   paidCount      = paymentStatus === 'paid'
//   cancelledCount = status in { cancelled_by_user, cancelled_by_admin }
//   activeCount    = enrollments that still occupy a seat (total − cancelled)
//
// `activeCount` is what the capacity strip compares against; it deliberately
// excludes cancelled records so an admin can cancel someone and see a seat
// free up.

import type { Enrollment } from '@/entities/event';

const CANCELLED_STATUSES = new Set<Enrollment['status']>([
    'cancelled_by_user',
    'cancelled_by_admin',
]);

export interface EnrollmentsSummary {
    totalCount: number;
    paidCount: number;
    cancelledCount: number;
    activeCount: number;
}

export function deriveSummary(enrollments: readonly Enrollment[]): EnrollmentsSummary {
    let paid = 0;
    let cancelled = 0;
    for (const e of enrollments) {
        if (e.paymentStatus === 'paid') paid += 1;
        if (CANCELLED_STATUSES.has(e.status)) cancelled += 1;
    }
    return {
        totalCount: enrollments.length,
        paidCount: paid,
        cancelledCount: cancelled,
        activeCount: enrollments.length - cancelled,
    };
}
