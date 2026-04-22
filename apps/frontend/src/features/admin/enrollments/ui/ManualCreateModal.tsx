// features/admin/enrollments/ui/ManualCreateModal.tsx

import { useMemo, useState } from 'react';

import type { EnrollmentStatus, PaymentStatus } from '@/entities/event';

import {
    AdminActionError,
    createAdminEnrollment,
} from '../api/enrollmentsAdminApi';
import { evaluateManualCreateInput } from '../formValidation';

import { ActionModal } from './ActionModal';

type Props = {
    eventPageId: string;
    onClose: () => void;
    onCreated: () => void;
};

const STATUS_OPTIONS: ReadonlyArray<{ value: EnrollmentStatus | ''; label: string }> = [
    { value: '', label: 'Default (pending)' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
];

const PAYMENT_OPTIONS: ReadonlyArray<{ value: PaymentStatus | ''; label: string }> = [
    { value: '', label: 'Default (by event price)' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'paid', label: 'Paid' },
];

export function ManualCreateModal({ eventPageId, onClose, onCreated }: Props) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [note, setNote] = useState('');
    const [status, setStatus] = useState<EnrollmentStatus | ''>('');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const validity = useMemo(
        () => evaluateManualCreateInput({ fullName, email, phone, note }),
        [fullName, email, phone, note],
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validity.canSubmit || submitting) return;
        setError('');
        setSubmitting(true);
        try {
            await createAdminEnrollment(eventPageId, {
                fullName: fullName.trim(),
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                note: note.trim() || undefined,
                status: status || undefined,
                paymentStatus: paymentStatus || undefined,
            });
            onCreated();
        } catch (err) {
            if (err instanceof AdminActionError) {
                if (err.kind === 'conflict') {
                    setError('This event is full.');
                } else {
                    setError(err.message);
                }
            } else {
                setError(err instanceof Error ? err.message : 'Failed to create');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ActionModal title="Add enrollment" onClose={onClose} busy={submitting}>
            <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                <div className="admin-enroll-modal__field">
                    <label htmlFor="create-name">Full name</label>
                    <input
                        id="create-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        autoFocus
                    />
                </div>
                <div className="admin-enroll-modal__field">
                    <label htmlFor="create-email">Email</label>
                    <input
                        id="create-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. alex@example.com"
                    />
                    {validity.emailMalformed && (
                        <span className="admin-enroll-modal__hint">Please enter a valid email</span>
                    )}
                </div>
                <div className="admin-enroll-modal__field">
                    <label htmlFor="create-phone">Phone</label>
                    <input
                        id="create-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +1 555 0100"
                    />
                </div>
                {!validity.hasContact && (
                    <div className="admin-enroll-modal__hint admin-enroll-modal__hint--error">
                        Provide an email or a phone number.
                    </div>
                )}
                <div className="admin-enroll-modal__field">
                    <label htmlFor="create-note">Note</label>
                    <textarea
                        id="create-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                    />
                </div>

                <div className="admin-enroll-modal__grid">
                    <div className="admin-enroll-modal__field">
                        <label htmlFor="create-status">Status</label>
                        <select
                            id="create-status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as EnrollmentStatus | '')}
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="admin-enroll-modal__field">
                        <label htmlFor="create-payment">Payment</label>
                        <select
                            id="create-payment"
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus | '')}
                        >
                            {PAYMENT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <div className="admin-enroll-modal__error">{error}</div>}

                <div className="admin-enroll-modal__actions">
                    <button type="button" className="admin-enroll-modal__cancel" onClick={onClose} disabled={submitting}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="admin-enroll-modal__primary"
                        disabled={!validity.canSubmit || submitting}
                    >
                        {submitting ? 'Creating…' : 'Add enrollment'}
                    </button>
                </div>
            </form>
        </ActionModal>
    );
}
