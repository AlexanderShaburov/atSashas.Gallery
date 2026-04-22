// features/admin/enrollments/ui/AdminEnrollmentsDetail.tsx
//
// Per-event enrollments detail view. Phase 4 delivered the read-only
// surface; Phase 5B wires the action layer: row menu, status / payment
// changes, contact edit modal, manual-create modal, transfer modal.
// After any successful mutation we refetch the detail endpoint to stay
// consistent — simple and correct for MVP.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type { Enrollment, EnrollmentStatus, PaymentStatus } from '@/entities/event';

import {
    AdminActionError,
    DetailNotFoundError,
    fetchEnrollmentsDetail,
    patchEnrollmentPayment,
    patchEnrollmentStatus,
} from '../api/enrollmentsAdminApi';
import { contactLines } from '../contactDisplay';
import { deriveSummary } from '../summary';
import type { EnrollmentsDetailResponse } from '../types';

import { ContactEditModal } from './ContactEditModal';
import { ManualCreateModal } from './ManualCreateModal';
import { RowActionsMenu } from './RowActionsMenu';
import { TransferModal } from './TransferModal';

import './AdminEnrollmentsDetail.css';

type Props = {
    eventPageId: string;
};

type LoadState =
    | { kind: 'loading' }
    | { kind: 'not_found' }
    | { kind: 'error'; message: string }
    | { kind: 'loaded'; data: EnrollmentsDetailResponse };

type ModalState =
    | { kind: 'none' }
    | { kind: 'create' }
    | { kind: 'editContact'; enrollment: Enrollment }
    | { kind: 'transfer'; enrollment: Enrollment };

function formatDate(raw: string | null | undefined): string {
    if (!raw) return 'No date set';
    const head = raw.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(head) ? head : raw;
}

function formatDateTime(raw: string): string {
    if (!raw) return '';
    const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(raw);
    if (match) return `${match[1]} · ${match[2]}`;
    return raw.slice(0, 10);
}

function statusPillClass(status: string): string {
    return `admin-enroll-detail__status admin-enroll-detail__status--${status.replace(/_/g, '-')}`;
}

function paymentPillClass(status: Enrollment['paymentStatus']): string {
    return `admin-enroll-detail__pay admin-enroll-detail__pay--${status}`;
}

function humanEnrollmentStatus(status: Enrollment['status']): string {
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

function humanEventStatus(status: string): string {
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

export function AdminEnrollmentsDetail({ eventPageId }: Props) {
    const [state, setState] = useState<LoadState>({ kind: 'loading' });
    const [modal, setModal] = useState<ModalState>({ kind: 'none' });
    const [actionError, setActionError] = useState<string>('');
    const [inFlight, setInFlight] = useState<string | null>(null);

    const load = useCallback(
        (signal?: AbortSignal) => {
            return fetchEnrollmentsDetail(eventPageId, signal)
                .then((data) => {
                    setState({ kind: 'loaded', data });
                })
                .catch((err: unknown) => {
                    if (err instanceof DOMException && err.name === 'AbortError') return;
                    if (err instanceof DetailNotFoundError) {
                        setState({ kind: 'not_found' });
                        return;
                    }
                    const message = err instanceof Error ? err.message : 'Failed to load';
                    setState({ kind: 'error', message });
                });
        },
        [eventPageId],
    );

    useEffect(() => {
        const ctrl = new AbortController();
        setState({ kind: 'loading' });
        void load(ctrl.signal);
        return () => ctrl.abort();
    }, [load]);

    const refresh = useCallback(() => {
        void load();
    }, [load]);

    const summary = useMemo(() => {
        if (state.kind !== 'loaded') return null;
        return deriveSummary(state.data.enrollments);
    }, [state]);

    const handleStatusChange = async (enrollment: Enrollment, nextStatus: EnrollmentStatus) => {
        setActionError('');
        setInFlight(enrollment.id);
        try {
            await patchEnrollmentStatus(eventPageId, enrollment.id, nextStatus);
            refresh();
        } catch (err) {
            setActionError(
                err instanceof AdminActionError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : 'Failed to change status',
            );
        } finally {
            setInFlight(null);
        }
    };

    const handlePaymentToggle = async (enrollment: Enrollment, nextPayment: PaymentStatus) => {
        setActionError('');
        setInFlight(enrollment.id);
        try {
            await patchEnrollmentPayment(eventPageId, enrollment.id, nextPayment);
            refresh();
        } catch (err) {
            setActionError(
                err instanceof AdminActionError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : 'Failed to update payment',
            );
        } finally {
            setInFlight(null);
        }
    };

    const backLink = (
        <p className="admin-enroll-detail__back">
            <Link to="/admin/enrollments">← All enrollments</Link>
        </p>
    );

    if (state.kind === 'loading') {
        return (
            <div className="admin-enroll-detail">
                {backLink}
                <div className="admin-enroll-detail__state admin-enroll-detail__state--loading">
                    Loading enrollments…
                </div>
            </div>
        );
    }

    if (state.kind === 'not_found') {
        return (
            <div className="admin-enroll-detail">
                {backLink}
                <div className="admin-enroll-detail__state admin-enroll-detail__state--empty">
                    <h2>Event not found</h2>
                    <p>
                        No event matches the id <code>{eventPageId}</code>.
                    </p>
                </div>
            </div>
        );
    }

    if (state.kind === 'error') {
        return (
            <div className="admin-enroll-detail">
                {backLink}
                <div className="admin-enroll-detail__state admin-enroll-detail__state--error" role="alert">
                    {state.message}
                </div>
            </div>
        );
    }

    const { event, enrollments } = state.data;
    const s = summary!;
    const capacityLabel =
        event.capacity != null ? `${s.activeCount} / ${event.capacity}` : `${s.activeCount}`;
    // `returnTo` is consumed by the Event Page editor bootstrap so that the
    // editor's in-app back navigates here instead of dropping into the
    // editor's generic select state. The `/admin/` prefix is validated on
    // the other side to avoid open-redirect risk.
    const returnTo = `/admin/enrollments/${event.id}`;
    const editorLink =
        `/admin/event-pages?edit=${encodeURIComponent(event.id)}` +
        `&returnTo=${encodeURIComponent(returnTo)}`;

    return (
        <div className="admin-enroll-detail">
            {backLink}

            <header className="admin-enroll-detail__header">
                <div className="admin-enroll-detail__heading">
                    <h1>{event.title || '(untitled event)'}</h1>
                    <div className="admin-enroll-detail__meta">
                        <span className="admin-enroll-detail__date">{formatDate(event.dateStart)}</span>
                        <span className={statusPillClass(event.status)}>
                            {humanEventStatus(event.status)}
                        </span>
                    </div>
                </div>

                <div className="admin-enroll-detail__header-actions">
                    <button
                        type="button"
                        className="admin-enroll-detail__primary-action"
                        onClick={() => setModal({ kind: 'create' })}
                    >
                        + Add enrollment
                    </button>
                    <Link to={editorLink} className="admin-enroll-detail__editor-link">
                        Open in Event Page editor ↗
                    </Link>
                </div>
            </header>

            <section className="admin-enroll-detail__summary" aria-label="Enrollment summary">
                <div className="admin-enroll-detail__summary-item">
                    <span className="admin-enroll-detail__summary-label">Enrolled</span>
                    <strong className="admin-enroll-detail__summary-value">{capacityLabel}</strong>
                </div>
                <div className="admin-enroll-detail__summary-item">
                    <span className="admin-enroll-detail__summary-label">Paid</span>
                    <strong className="admin-enroll-detail__summary-value">
                        {s.paidCount} / {s.totalCount}
                    </strong>
                </div>
                <div className="admin-enroll-detail__summary-item">
                    <span className="admin-enroll-detail__summary-label">Cancelled</span>
                    <strong className="admin-enroll-detail__summary-value">{s.cancelledCount}</strong>
                </div>
            </section>

            {actionError && (
                <div className="admin-enroll-detail__state admin-enroll-detail__state--error" role="alert">
                    {actionError}
                    <button
                        type="button"
                        className="admin-enroll-detail__dismiss"
                        onClick={() => setActionError('')}
                        aria-label="Dismiss error"
                    >
                        ✕
                    </button>
                </div>
            )}

            {enrollments.length === 0 ? (
                <div className="admin-enroll-detail__state admin-enroll-detail__state--empty">
                    No enrollments yet for this event.
                </div>
            ) : (
                <div className="admin-enroll-detail__table-wrap">
                    <table className="admin-enroll-detail__table">
                        <thead>
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Contact</th>
                                <th scope="col">Status</th>
                                <th scope="col">Payment</th>
                                <th scope="col">Created</th>
                                <th scope="col" className="admin-enroll-detail__actions-head" aria-label="Actions">
                                    {' '}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrollments.map((e) => (
                                <tr
                                    key={e.id}
                                    className={inFlight === e.id ? 'admin-enroll-detail__row--busy' : undefined}
                                >
                                    <td>{e.fullName}</td>
                                    <td>
                                        <ContactCell enrollment={e} />
                                    </td>
                                    <td>
                                        <span className={statusPillClass(e.status)}>
                                            {humanEnrollmentStatus(e.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={paymentPillClass(e.paymentStatus)}>
                                            {e.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </td>
                                    <td className="admin-enroll-detail__created">
                                        {formatDateTime(e.createdAt)}
                                    </td>
                                    <td>
                                        <RowActionsMenu
                                            enrollment={e}
                                            onChangeStatus={(next) => void handleStatusChange(e, next)}
                                            onTogglePayment={(next) =>
                                                void handlePaymentToggle(e, next)
                                            }
                                            onEditContact={() =>
                                                setModal({ kind: 'editContact', enrollment: e })
                                            }
                                            onTransfer={() =>
                                                setModal({ kind: 'transfer', enrollment: e })
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal.kind === 'create' && (
                <ManualCreateModal
                    eventPageId={eventPageId}
                    onClose={() => setModal({ kind: 'none' })}
                    onCreated={() => {
                        setModal({ kind: 'none' });
                        refresh();
                    }}
                />
            )}
            {modal.kind === 'editContact' && (
                <ContactEditModal
                    eventPageId={eventPageId}
                    enrollment={modal.enrollment}
                    onClose={() => setModal({ kind: 'none' })}
                    onSaved={() => {
                        setModal({ kind: 'none' });
                        refresh();
                    }}
                />
            )}
            {modal.kind === 'transfer' && (
                <TransferModal
                    sourceEventPageId={eventPageId}
                    enrollmentId={modal.enrollment.id}
                    enrollmentName={modal.enrollment.fullName}
                    onClose={() => setModal({ kind: 'none' })}
                    onTransferred={() => {
                        setModal({ kind: 'none' });
                        refresh();
                    }}
                />
            )}
        </div>
    );
}

function ContactCell({ enrollment }: { enrollment: Enrollment }) {
    const lines = contactLines(enrollment);
    if (lines.length === 0) {
        return <span className="admin-enroll-detail__muted">(none)</span>;
    }
    return (
        <ul className="admin-enroll-detail__contact">
            {lines.map((l) => (
                <li key={`${l.kind}:${l.value}`}>
                    <span className="admin-enroll-detail__contact-label">
                        {l.kind === 'email' ? '✉' : '☏'}
                    </span>
                    <span className="admin-enroll-detail__contact-value">{l.value}</span>
                </li>
            ))}
        </ul>
    );
}
