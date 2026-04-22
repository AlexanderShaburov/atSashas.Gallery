// features/admin/enrollments/ui/AdminEnrollmentsList.tsx
//
// Top-level admin screen for event enrollments (Phase 3 of
// knowledge/plans/plan--admin--event-enrollments-management.md).
// Read-only list + tab-based Upcoming/Past/All filter. Row click
// navigates to the Phase 4 detail route (stubbed for now).

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchEnrollmentsOverview } from '../api/enrollmentsAdminApi';
import { partitionAndSort } from '../filterAndSort';
import type { EnrollmentOverviewRow, OverviewFilter } from '../types';

import './AdminEnrollmentsList.css';

type LoadState =
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'loaded'; rows: EnrollmentOverviewRow[] };

const FILTER_TABS: ReadonlyArray<{ key: OverviewFilter; label: string }> = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'all', label: 'All' },
];

function formatDate(raw: string | null | undefined): string {
    if (!raw) return '—';
    const head = raw.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(head)) return raw;
    // Simple, locale-free rendering that matches the admin's English-only UI.
    const [y, m, d] = head.split('-');
    return `${y}-${m}-${d}`;
}

function statusLabel(status: string): string {
    switch (status) {
        case 'scheduled':
            return 'Scheduled';
        case 'draft':
            return 'Draft';
        case 'closed':
            return 'Closed';
        default:
            return status;
    }
}

export function AdminEnrollmentsList() {
    const [state, setState] = useState<LoadState>({ kind: 'loading' });
    const [filter, setFilter] = useState<OverviewFilter>('upcoming');

    useEffect(() => {
        const ctrl = new AbortController();
        let cancelled = false;
        setState({ kind: 'loading' });
        fetchEnrollmentsOverview(ctrl.signal)
            .then((rows) => {
                if (cancelled) return;
                setState({ kind: 'loaded', rows });
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                if (err instanceof DOMException && err.name === 'AbortError') return;
                const message =
                    err instanceof Error ? err.message : 'Failed to load enrollments';
                setState({ kind: 'error', message });
            });
        return () => {
            cancelled = true;
            ctrl.abort();
        };
    }, []);

    const partition = useMemo(() => {
        if (state.kind !== 'loaded') {
            return {
                rows: [] as EnrollmentOverviewRow[],
                upcomingCount: 0,
                pastCount: 0,
                allCount: 0,
            };
        }
        return partitionAndSort(state.rows, filter);
    }, [state, filter]);

    return (
        <div className="admin-enrollments">
            <header className="admin-enrollments__header">
                <h1>Enrollments</h1>
                <p className="admin-enrollments__subtitle">
                    Event occurrences with enrollments. Click a row to see its roster.
                </p>
            </header>

            <nav className="admin-enrollments__tabs" role="tablist" aria-label="Filter events">
                {FILTER_TABS.map((tab) => {
                    const count =
                        tab.key === 'upcoming'
                            ? partition.upcomingCount
                            : tab.key === 'past'
                              ? partition.pastCount
                              : partition.allCount;
                    const isActive = filter === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`admin-enrollments__tab${isActive ? ' admin-enrollments__tab--active' : ''}`}
                            onClick={() => setFilter(tab.key)}
                        >
                            {tab.label}
                            <span className="admin-enrollments__tab-count" aria-label={`${count} events`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {state.kind === 'loading' && (
                <div className="admin-enrollments__state admin-enrollments__state--loading">
                    Loading enrollments…
                </div>
            )}

            {state.kind === 'error' && (
                <div className="admin-enrollments__state admin-enrollments__state--error" role="alert">
                    {state.message}
                </div>
            )}

            {state.kind === 'loaded' && partition.rows.length === 0 && (
                <div className="admin-enrollments__state admin-enrollments__state--empty">
                    {filter === 'upcoming'
                        ? 'No upcoming events.'
                        : filter === 'past'
                          ? 'No past events.'
                          : 'No events yet.'}
                </div>
            )}

            {state.kind === 'loaded' && partition.rows.length > 0 && (
                <div className="admin-enrollments__table-wrap">
                    <table className="admin-enrollments__table">
                        <thead>
                            <tr>
                                <th scope="col">Date</th>
                                <th scope="col">Event</th>
                                <th scope="col" className="admin-enrollments__num">
                                    Enrolled / Capacity
                                </th>
                                <th scope="col" className="admin-enrollments__num">
                                    Paid
                                </th>
                                <th scope="col">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partition.rows.map((row) => {
                                const capacityLabel =
                                    row.capacity != null ? `${row.totalCount} / ${row.capacity}` : `${row.totalCount}`;
                                const dateMissing = !row.dateStart;
                                return (
                                    <tr key={row.eventPageId}>
                                        <td>
                                            <Link
                                                to={`/admin/enrollments/${row.eventPageId}`}
                                                className="admin-enrollments__row-link"
                                            >
                                                {formatDate(row.dateStart)}
                                                {dateMissing && (
                                                    <span className="admin-enrollments__badge admin-enrollments__badge--warn">
                                                        no date
                                                    </span>
                                                )}
                                            </Link>
                                        </td>
                                        <td>
                                            <Link
                                                to={`/admin/enrollments/${row.eventPageId}`}
                                                className="admin-enrollments__row-link"
                                            >
                                                {row.title || <em className="admin-enrollments__muted">(untitled)</em>}
                                            </Link>
                                        </td>
                                        <td className="admin-enrollments__num">{capacityLabel}</td>
                                        <td className="admin-enrollments__num">{row.paidCount}</td>
                                        <td>
                                            <span
                                                className={`admin-enrollments__status admin-enrollments__status--${row.status}`}
                                            >
                                                {statusLabel(row.status)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
