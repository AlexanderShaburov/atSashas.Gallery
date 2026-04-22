// features/admin/enrollments/ui/ContactEditModal.tsx

import { useMemo, useState } from 'react';

import type { Enrollment } from '@/entities/event';

import {
    AdminActionError,
    patchEnrollmentContact,
} from '../api/enrollmentsAdminApi';
import { diffContactPatch, evaluateContactFormInput } from '../formValidation';

import { ActionModal } from './ActionModal';

type Props = {
    eventPageId: string;
    enrollment: Enrollment;
    onClose: () => void;
    onSaved: () => void;
};

export function ContactEditModal({ eventPageId, enrollment, onClose, onSaved }: Props) {
    const [fullName, setFullName] = useState(enrollment.fullName);
    const [email, setEmail] = useState(enrollment.email ?? '');
    const [phone, setPhone] = useState(enrollment.phone ?? '');
    const [note, setNote] = useState(enrollment.note ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string>('');

    const validity = useMemo(
        () =>
            evaluateContactFormInput({
                currentEmail: enrollment.email ?? null,
                currentPhone: enrollment.phone ?? null,
                fullName,
                email,
                phone,
                note,
            }),
        [enrollment.email, enrollment.phone, fullName, email, phone, note],
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validity.canSubmit || submitting) return;
        setError('');
        setSubmitting(true);
        try {
            const patch = diffContactPatch({
                currentEmail: enrollment.email ?? null,
                currentPhone: enrollment.phone ?? null,
                fullName,
                email,
                phone,
                note,
            });
            await patchEnrollmentContact(eventPageId, enrollment.id, patch);
            onSaved();
        } catch (err) {
            if (err instanceof AdminActionError) {
                setError(err.message);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to save');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ActionModal title="Edit enrollment" onClose={onClose} busy={submitting}>
            <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                <div className="admin-enroll-modal__field">
                    <label htmlFor="contact-name">Full name</label>
                    <input
                        id="contact-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />
                </div>
                <div className="admin-enroll-modal__field">
                    <label htmlFor="contact-email">Email</label>
                    <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="empty to clear"
                    />
                    {validity.emailMalformed && (
                        <span className="admin-enroll-modal__hint">Please enter a valid email</span>
                    )}
                </div>
                <div className="admin-enroll-modal__field">
                    <label htmlFor="contact-phone">Phone</label>
                    <input
                        id="contact-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="empty to clear"
                    />
                </div>
                {!validity.resultingHasContact && (
                    <div className="admin-enroll-modal__hint admin-enroll-modal__hint--error">
                        At least one of email or phone is required.
                    </div>
                )}
                <div className="admin-enroll-modal__field">
                    <label htmlFor="contact-note">Note</label>
                    <textarea
                        id="contact-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                    />
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
                        {submitting ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </ActionModal>
    );
}
