// Phase 5B — legal-transition surface the RowActionsMenu renders.
// Must stay in sync with the backend graph in
// apps/admin-backend/app/routers/enrollments/enrollments.py §5A.

import { describe, expect, it } from 'vitest';

import {
    canTransfer,
    humanEnrollmentStatus,
    isTerminalStatus,
    legalNextStatuses,
    TERMINAL_STATUSES,
} from '../actionRules';

describe('legalNextStatuses', () => {
    it('pending → confirmed / cancelled_by_user / cancelled_by_admin', () => {
        expect([...legalNextStatuses('pending')]).toEqual([
            'confirmed',
            'cancelled_by_user',
            'cancelled_by_admin',
        ]);
    });

    it('confirmed → attended / no_show / cancelled_by_admin', () => {
        expect([...legalNextStatuses('confirmed')]).toEqual([
            'attended',
            'no_show',
            'cancelled_by_admin',
        ]);
    });

    it.each([
        'cancelled_by_user',
        'cancelled_by_admin',
        'no_show',
        'attended',
    ] as const)('terminal %s has no legal next transitions', (s) => {
        expect(legalNextStatuses(s)).toEqual([]);
    });
});

describe('isTerminalStatus', () => {
    it('identifies all four terminal states', () => {
        for (const s of [
            'cancelled_by_user',
            'cancelled_by_admin',
            'no_show',
            'attended',
        ] as const) {
            expect(isTerminalStatus(s)).toBe(true);
        }
        expect(TERMINAL_STATUSES.size).toBe(4);
    });

    it('pending and confirmed are not terminal', () => {
        expect(isTerminalStatus('pending')).toBe(false);
        expect(isTerminalStatus('confirmed')).toBe(false);
    });
});

describe('canTransfer', () => {
    it('rejects terminal enrollments', () => {
        expect(canTransfer({ status: 'cancelled_by_admin' })).toBe(false);
        expect(canTransfer({ status: 'attended' })).toBe(false);
    });
    it('allows active enrollments', () => {
        expect(canTransfer({ status: 'pending' })).toBe(true);
        expect(canTransfer({ status: 'confirmed' })).toBe(true);
    });
});

describe('humanEnrollmentStatus', () => {
    it('covers all six enum values with human labels', () => {
        expect(humanEnrollmentStatus('pending')).toBe('Pending');
        expect(humanEnrollmentStatus('confirmed')).toBe('Confirmed');
        expect(humanEnrollmentStatus('cancelled_by_user')).toBe('Cancelled (user)');
        expect(humanEnrollmentStatus('cancelled_by_admin')).toBe('Cancelled (admin)');
        expect(humanEnrollmentStatus('no_show')).toBe('No-show');
        expect(humanEnrollmentStatus('attended')).toBe('Attended');
    });
});
