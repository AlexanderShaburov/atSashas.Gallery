// Phase 3 filter + sort semantics for the admin enrollments overview.
// See knowledge/plans/plan--admin--event-enrollments-management.md §Phase 3.

import { describe, expect, it } from 'vitest';

import {
    dayPart,
    partitionAndSort,
    sortByDate,
    todayIso,
} from '../filterAndSort';
import type { EnrollmentOverviewRow } from '../types';

function row(
    id: string,
    dateStart: string | null | undefined,
    title = id,
): EnrollmentOverviewRow {
    return {
        eventPageId: id,
        title,
        dateStart: dateStart ?? null,
        status: 'scheduled',
        capacity: null,
        totalCount: 0,
        paidCount: 0,
        cancelledCount: 0,
    };
}

const TODAY = '2026-04-22';

describe('dayPart', () => {
    it('returns the day portion of a full ISO datetime', () => {
        expect(dayPart('2026-04-22T10:00:00+00:00')).toBe('2026-04-22');
    });

    it('returns the input as-is for a bare ISO date', () => {
        expect(dayPart('2026-04-22')).toBe('2026-04-22');
    });

    it('returns null for missing or malformed values', () => {
        expect(dayPart(null)).toBeNull();
        expect(dayPart(undefined)).toBeNull();
        expect(dayPart('')).toBeNull();
        expect(dayPart('not-a-date')).toBeNull();
        expect(dayPart('2026/04/22')).toBeNull();
    });
});

describe('todayIso', () => {
    it('formats a Date as YYYY-MM-DD', () => {
        const d = new Date(2026, 3, 22); // month is zero-indexed
        expect(todayIso(d)).toBe('2026-04-22');
    });

    it('pads single-digit month and day', () => {
        const d = new Date(2026, 0, 5);
        expect(todayIso(d)).toBe('2026-01-05');
    });
});

describe('sortByDate', () => {
    it('sorts ascending, missing dates last', () => {
        const rows = [
            row('c', '2026-05-01'),
            row('a', '2026-04-01'),
            row('z', null),
            row('b', '2026-04-15'),
        ];
        const result = sortByDate(rows, 'asc').map((r) => r.eventPageId);
        expect(result).toEqual(['a', 'b', 'c', 'z']);
    });

    it('sorts descending, missing dates still last', () => {
        const rows = [
            row('c', '2026-05-01'),
            row('a', '2026-04-01'),
            row('z', null),
            row('b', '2026-04-15'),
        ];
        const result = sortByDate(rows, 'desc').map((r) => r.eventPageId);
        expect(result).toEqual(['c', 'b', 'a', 'z']);
    });

    it('breaks ties on date by title', () => {
        const rows = [
            row('second', '2026-04-22', 'B'),
            row('first', '2026-04-22', 'A'),
        ];
        const result = sortByDate(rows, 'asc').map((r) => r.eventPageId);
        expect(result).toEqual(['first', 'second']);
    });
});

describe('partitionAndSort — upcoming', () => {
    it('includes same-day and future-dated events, missing dates also upcoming', () => {
        const rows = [
            row('today', TODAY),
            row('yesterday', '2026-04-21'),
            row('tomorrow', '2026-04-23'),
            row('no-date', null),
            row('next-month', '2026-05-10'),
        ];
        const { rows: out, upcomingCount, pastCount, allCount } = partitionAndSort(
            rows,
            'upcoming',
            TODAY,
        );
        expect(out.map((r) => r.eventPageId)).toEqual([
            'today',
            'tomorrow',
            'next-month',
            'no-date',
        ]);
        expect(upcomingCount).toBe(4);
        expect(pastCount).toBe(1);
        expect(allCount).toBe(5);
    });
});

describe('partitionAndSort — past', () => {
    it('includes strictly past events, sorted descending; missing dates excluded', () => {
        const rows = [
            row('yesterday', '2026-04-21'),
            row('today', TODAY),
            row('no-date', null),
            row('last-year', '2025-12-31'),
            row('last-week', '2026-04-15'),
        ];
        const { rows: out, pastCount } = partitionAndSort(rows, 'past', TODAY);
        expect(out.map((r) => r.eventPageId)).toEqual([
            'yesterday',
            'last-week',
            'last-year',
        ]);
        expect(pastCount).toBe(3);
    });
});

describe('partitionAndSort — all', () => {
    it('returns every row sorted ascending, missing dates last', () => {
        const rows = [
            row('future', '2026-06-01'),
            row('past', '2024-01-01'),
            row('today', TODAY),
            row('no-date', null),
        ];
        const { rows: out, allCount } = partitionAndSort(rows, 'all', TODAY);
        expect(out.map((r) => r.eventPageId)).toEqual([
            'past',
            'today',
            'future',
            'no-date',
        ]);
        expect(allCount).toBe(4);
    });
});

describe('partitionAndSort — edge cases', () => {
    it('handles empty input safely', () => {
        const result = partitionAndSort([], 'upcoming', TODAY);
        expect(result.rows).toEqual([]);
        expect(result.upcomingCount).toBe(0);
        expect(result.pastCount).toBe(0);
        expect(result.allCount).toBe(0);
    });

    it('treats datetimes with time components the same as bare dates', () => {
        const rows = [
            row('midnight', '2026-04-22T00:00:00+00:00'),
            row('evening', '2026-04-21T23:00:00+00:00'),
        ];
        const { rows: out } = partitionAndSort(rows, 'upcoming', TODAY);
        expect(out.map((r) => r.eventPageId)).toEqual(['midnight']);
    });
});
