// features/admin/enrollments/ui/TransferModal.tsx

import { useEffect, useMemo, useState } from 'react';

import {
    AdminActionError,
    fetchEnrollmentsOverview,
    transferEnrollment,
} from '../api/enrollmentsAdminApi';
import { partitionAndSort } from '../filterAndSort';
import type { EnrollmentOverviewRow } from '../types';

import { ActionModal } from './ActionModal';

type Props = {
    sourceEventPageId: string;
    enrollmentId: string;
    enrollmentName: string;
    onClose: () => void;
    onTransferred: () => void;
};

type ListState =
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'loaded'; rows: EnrollmentOverviewRow[] };

function isDestinationFull(row: EnrollmentOverviewRow): boolean {
    if (row.capacity == null) return false;
    const active = row.totalCount - row.cancelledCount;
    return active >= row.capacity;
}

export function TransferModal({
    sourceEventPageId,
    enrollmentId,
    enrollmentName,
    onClose,
    onTransferred,
}: Props) {
    const [listState, setListState] = useState<ListState>({ kind: 'loading' });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const ctrl = new AbortController();
        let cancelled = false;
        fetchEnrollmentsOverview(ctrl.signal)
            .then((rows) => {
                if (cancelled) return;
                setListState({ kind: 'loaded', rows });
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                if (err instanceof DOMException && err.name === 'AbortError') return;
                const message = err instanceof Error ? err.message : 'Failed to load events';
                setListState({ kind: 'error', message });
            });
        return () => {
            cancelled = true;
            ctrl.abort();
        };
    }, []);

    const candidates = useMemo(() => {
        if (listState.kind !== 'loaded') return [];
        // Upcoming only, exclude the source event.
        const { rows } = partitionAndSort(listState.rows, 'upcoming');
        return rows.filter((r) => r.eventPageId !== sourceEventPageId);
    }, [listState, sourceEventPageId]);

    const handleTransfer = async () => {
        if (!selectedId || submitting) return;
        setError('');
        setSubmitting(true);
        try {
            await transferEnrollment(sourceEventPageId, enrollmentId, selectedId);
            onTransferred();
        } catch (err) {
            if (err instanceof AdminActionError) {
                if (err.kind === 'conflict') {
                    setError(err.message || 'Transfer rejected.');
                } else {
                    setError(err.message);
                }
            } else {
                setError(err instanceof Error ? err.message : 'Transfer failed');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ActionModal title={`Transfer ${enrollmentName}`} onClose={onClose} busy={submitting}>
            <p className="admin-enroll-modal__subtitle">
                Choose an upcoming event to move this enrollment to. The original record is removed
                and a new one is created in the destination.
            </p>

            {listState.kind === 'loading' && (
                <div className="admin-enroll-modal__state">Loading events…</div>
            )}
            {listState.kind === 'error' && (
                <div className="admin-enroll-modal__error" role="alert">
                    {listState.message}
                </div>
            )}
            {listState.kind === 'loaded' && candidates.length === 0 && (
                <div className="admin-enroll-modal__state">
                    No upcoming events available as a transfer destination.
                </div>
            )}
            {listState.kind === 'loaded' && candidates.length > 0 && (
                <ul className="admin-enroll-modal__picker" role="listbox" aria-label="Destination events">
                    {candidates.map((row) => {
                        const full = isDestinationFull(row);
                        const selected = selectedId === row.eventPageId;
                        return (
                            <li key={row.eventPageId}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    className={`admin-enroll-modal__picker-row${
                                        selected ? ' admin-enroll-modal__picker-row--selected' : ''
                                    }${full ? ' admin-enroll-modal__picker-row--disabled' : ''}`}
                                    onClick={() => !full && setSelectedId(row.eventPageId)}
                                    disabled={full}
                                    title={full ? 'This event is at capacity.' : undefined}
                                >
                                    <span className="admin-enroll-modal__picker-date">
                                        {row.dateStart?.slice(0, 10) ?? '—'}
                                    </span>
                                    <span className="admin-enroll-modal__picker-title">
                                        {row.title || <em>(untitled)</em>}
                                    </span>
                                    <span className="admin-enroll-modal__picker-capacity">
                                        {row.capacity != null
                                            ? `${row.totalCount - row.cancelledCount}/${row.capacity}`
                                            : `${row.totalCount - row.cancelledCount}`}
                                        {full && <span className="admin-enroll-modal__picker-full">full</span>}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {error && <div className="admin-enroll-modal__error">{error}</div>}

            <div className="admin-enroll-modal__actions">
                <button type="button" className="admin-enroll-modal__cancel" onClick={onClose} disabled={submitting}>
                    Cancel
                </button>
                <button
                    type="button"
                    className="admin-enroll-modal__primary"
                    disabled={!selectedId || submitting}
                    onClick={() => void handleTransfer()}
                >
                    {submitting ? 'Transferring…' : 'Transfer'}
                </button>
            </div>
        </ActionModal>
    );
}
