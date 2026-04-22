// features/admin/enrollments/filterAndSort.ts
//
// Pure client-side partitioning + sorting for the Admin Enrollments
// overview list. Semantics match
// knowledge/plans/plan--admin--event-enrollments-management.md §Phase 3 /
// §4 UI flow:
//
//   Upcoming → dateStart >= today OR dateStart missing   (sorted asc)
//   Past     → dateStart <  today                        (sorted desc)
//   All      → every row                                 (sorted asc, undated last)
//
// `today` is a YYYY-MM-DD boundary. Same-day events count as upcoming
// per the plan (§4, "Same-day events count as upcoming").

import type { EnrollmentOverviewRow, OverviewFilter } from './types';

/** Extract the calendar-day portion of an ISO date-or-datetime, or null. */
export function dayPart(value?: string | null): string | null {
    if (!value) return null;
    // ISO dates and datetimes both start with YYYY-MM-DD; everything after
    // the first 10 chars is time + tz and is irrelevant for day-boundary
    // comparisons.
    const trimmed = value.trim();
    if (trimmed.length < 10) return null;
    const head = trimmed.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(head) ? head : null;
}

/** Today as YYYY-MM-DD in the caller's local time zone. */
export function todayIso(now: Date = new Date()): string {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function isUpcomingRow(row: EnrollmentOverviewRow, today: string): boolean {
    const day = dayPart(row.dateStart);
    if (day === null) return true; // Missing dateStart surfaces in Upcoming.
    return day >= today;
}

function isPastRow(row: EnrollmentOverviewRow, today: string): boolean {
    const day = dayPart(row.dateStart);
    if (day === null) return false;
    return day < today;
}

/**
 * Sort rows by `dateStart` in the requested direction. Rows without a
 * `dateStart` always sink to the end regardless of direction — they need
 * admin attention but should not crowd the top of either list.
 */
export function sortByDate(
    rows: readonly EnrollmentOverviewRow[],
    direction: 'asc' | 'desc',
): EnrollmentOverviewRow[] {
    const sign = direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
        const da = dayPart(a.dateStart);
        const db = dayPart(b.dateStart);
        if (da === null && db === null) return a.title.localeCompare(b.title);
        if (da === null) return 1;
        if (db === null) return -1;
        if (da === db) return a.title.localeCompare(b.title);
        return sign * da.localeCompare(db);
    });
}

export interface PartitionResult {
    readonly rows: EnrollmentOverviewRow[];
    readonly upcomingCount: number;
    readonly pastCount: number;
    readonly allCount: number;
}

export function partitionAndSort(
    rows: readonly EnrollmentOverviewRow[],
    filter: OverviewFilter,
    today: string = todayIso(),
): PartitionResult {
    const upcoming = rows.filter((r) => isUpcomingRow(r, today));
    const past = rows.filter((r) => isPastRow(r, today));

    let out: EnrollmentOverviewRow[];
    if (filter === 'upcoming') {
        out = sortByDate(upcoming, 'asc');
    } else if (filter === 'past') {
        out = sortByDate(past, 'desc');
    } else {
        out = sortByDate(rows, 'asc');
    }

    return {
        rows: out,
        upcomingCount: upcoming.length,
        pastCount: past.length,
        allCount: rows.length,
    };
}
