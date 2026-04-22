// Phase 4 summary-strip count derivation.
// See knowledge/plans/plan--admin--event-enrollments-management.md §Phase 4.

import { describe, expect, it } from 'vitest';

import type { Enrollment } from '@/entities/event';

import { deriveSummary } from '../summary';

function enroll(overrides: Partial<Enrollment>): Enrollment {
    return {
        id: overrides.id ?? 'enr-x',
        fullName: 'Test',
        email: 'test@example.com',
        status: overrides.status ?? 'pending',
        paymentStatus: overrides.paymentStatus ?? 'unpaid',
        createdBy: 'public',
        createdAt: '2026-04-22T10:00:00+00:00',
        updatedAt: '2026-04-22T10:00:00+00:00',
        ...overrides,
    };
}

describe('deriveSummary', () => {
    it('empty input yields all zeros', () => {
        expect(deriveSummary([])).toEqual({
            totalCount: 0,
            paidCount: 0,
            cancelledCount: 0,
            activeCount: 0,
        });
    });

    it('counts paid correctly', () => {
        const rows = [
            enroll({ id: '1', paymentStatus: 'paid' }),
            enroll({ id: '2', paymentStatus: 'unpaid' }),
            enroll({ id: '3', paymentStatus: 'paid' }),
        ];
        const s = deriveSummary(rows);
        expect(s.paidCount).toBe(2);
        expect(s.totalCount).toBe(3);
    });

    it('cancelledCount covers both cancellation states', () => {
        const rows = [
            enroll({ id: '1', status: 'cancelled_by_user' }),
            enroll({ id: '2', status: 'cancelled_by_admin' }),
            enroll({ id: '3', status: 'pending' }),
            enroll({ id: '4', status: 'confirmed' }),
        ];
        const s = deriveSummary(rows);
        expect(s.cancelledCount).toBe(2);
    });

    it('no_show and attended are NOT counted as cancelled', () => {
        const rows = [
            enroll({ id: '1', status: 'no_show' }),
            enroll({ id: '2', status: 'attended' }),
        ];
        const s = deriveSummary(rows);
        expect(s.cancelledCount).toBe(0);
    });

    it('activeCount excludes cancelled records', () => {
        const rows = [
            enroll({ id: '1', status: 'pending' }),
            enroll({ id: '2', status: 'confirmed' }),
            enroll({ id: '3', status: 'cancelled_by_user' }),
            enroll({ id: '4', status: 'cancelled_by_admin' }),
            enroll({ id: '5', status: 'attended' }),
        ];
        const s = deriveSummary(rows);
        expect(s.totalCount).toBe(5);
        expect(s.cancelledCount).toBe(2);
        expect(s.activeCount).toBe(3); // pending + confirmed + attended
    });

    it('combines paid and cancelled counts independently', () => {
        const rows = [
            enroll({ id: '1', status: 'cancelled_by_user', paymentStatus: 'paid' }),
            enroll({ id: '2', status: 'confirmed', paymentStatus: 'paid' }),
            enroll({ id: '3', status: 'pending', paymentStatus: 'unpaid' }),
        ];
        const s = deriveSummary(rows);
        expect(s.paidCount).toBe(2); // cancelled-but-paid still counts as paid
        expect(s.cancelledCount).toBe(1);
        expect(s.activeCount).toBe(2);
    });
});
