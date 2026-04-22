// features/public/ui/EventCta/EnrollmentForm.tsx

import { EnrollError, enrollPublic } from '@/features/public/api/enrollmentApi';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluateEnrollmentFormInput } from './enrollmentFormValidation';
import './EnrollmentForm.css';

type Props = {
    eventId: string;
    isFree: boolean;
    onCancel: () => void;
};

export function EnrollmentForm({ eventId, isFree, onCancel }: Props) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);
    const [contactTouched, setContactTouched] = useState(false);
    const nameRef = useRef<HTMLInputElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const validity = useMemo(
        () => evaluateEnrollmentFormInput({ fullName, email, phone }),
        [fullName, email, phone],
    );
    const { hasEmail, hasPhone, emailMalformed, contactMissing } = validity;
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const canSubmit = validity.canSubmit && !isSubmitting;

    // Focus first input on mount
    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    // Close on ESC
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onCancel]);

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
                onCancel();
            }
        },
        [onCancel],
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setContactTouched(true);

        try {
            setIsSubmitting(true);
            const result = await enrollPublic(eventId, {
                fullName: fullName.trim(),
                email: hasEmail ? trimmedEmail : undefined,
                phone: hasPhone ? trimmedPhone : undefined,
                note: note.trim() ? note.trim() : undefined,
            });

            if (result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                setSuccess(true);
            }
        } catch (err) {
            if (err instanceof EnrollError) {
                if (err.code === 'capacity') {
                    setError('This event is full.');
                } else {
                    setError(err.message);
                }
            } else {
                setError(err instanceof Error ? err.message : 'Something went wrong');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        const confirmationTarget = hasEmail ? trimmedEmail : trimmedPhone;
        return (
            <div className="enroll-backdrop" onClick={onCancel}>
                <div className="enroll-card enroll-card--success" ref={cardRef}>
                    <div className="enroll-success-icon">&#10003;</div>
                    <h3 className="enroll-card__title">You're in!</h3>
                    <p className="enroll-card__subtitle">
                        We'll be in touch at <strong>{confirmationTarget}</strong>.
                    </p>
                    <button className="enroll-btn enroll-btn--primary" onClick={onCancel}>
                        Done
                    </button>
                </div>
            </div>
        );
    }

    const showContactError = contactTouched && contactMissing;

    return (
        <div className="enroll-backdrop" onClick={handleBackdropClick}>
            <div className="enroll-card" ref={cardRef} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                    <h3 className="enroll-card__title">Join the workshop</h3>
                    <p className="enroll-card__subtitle">
                        Share your name and how we can reach you — email or phone.
                    </p>

                    <div className="enroll-field">
                        <label htmlFor="enroll-name" className="enroll-field__label">
                            Your name
                        </label>
                        <input
                            ref={nameRef}
                            id="enroll-name"
                            type="text"
                            className="enroll-field__input"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Alex"
                            autoComplete="name"
                            required
                        />
                    </div>

                    <div className="enroll-field">
                        <label htmlFor="enroll-email" className="enroll-field__label">
                            Email
                        </label>
                        <input
                            id="enroll-email"
                            type="email"
                            className={`enroll-field__input${emailTouched && emailMalformed ? ' enroll-field__input--invalid' : ''}`}
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setContactTouched(true);
                            }}
                            onBlur={() => setEmailTouched(true)}
                            placeholder="e.g. alex@email.com"
                            autoComplete="email"
                        />
                        {emailTouched && emailMalformed && (
                            <span className="enroll-field__hint">
                                Please enter a valid email
                            </span>
                        )}
                    </div>

                    <div className="enroll-field">
                        <label htmlFor="enroll-phone" className="enroll-field__label">
                            Phone
                        </label>
                        <input
                            id="enroll-phone"
                            type="tel"
                            className="enroll-field__input"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                setContactTouched(true);
                            }}
                            placeholder="e.g. +1 555 0100"
                            autoComplete="tel"
                        />
                    </div>

                    {showContactError && (
                        <div className="enroll-field__hint enroll-field__hint--error">
                            Provide either an email or a phone number so we can confirm.
                        </div>
                    )}

                    <div className="enroll-field">
                        <label htmlFor="enroll-note" className="enroll-field__label">
                            Anything we should know? <span className="enroll-field__label-hint">(optional)</span>
                        </label>
                        <textarea
                            id="enroll-note"
                            className="enroll-field__input enroll-field__input--textarea"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            placeholder="e.g. dietary needs, questions..."
                        />
                    </div>

                    {error && <div className="enroll-error">{error}</div>}

                    <div className="enroll-actions">
                        <button
                            type="button"
                            className="enroll-btn enroll-btn--cancel"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="enroll-btn enroll-btn--primary"
                            disabled={!canSubmit}
                        >
                            {isSubmitting
                                ? 'Processing...'
                                : isFree
                                  ? 'Confirm'
                                  : 'Continue to payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
