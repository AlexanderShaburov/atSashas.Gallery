// features/public/ui/EventCta/EnrollmentForm.tsx

import { enrollPublic } from '@/features/public/api/enrollmentApi';
import { useCallback, useEffect, useRef, useState } from 'react';
import './EnrollmentForm.css';

type Props = {
    eventId: string;
    isFree: boolean;
    onCancel: () => void;
};

export function EnrollmentForm({ eventId, isFree, onCancel }: Props) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);
    const nameRef = useRef<HTMLInputElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const canSubmit =
        fullName.trim().length > 0 && emailValid && !isSubmitting;

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

        try {
            setIsSubmitting(true);
            const result = await enrollPublic(eventId, {
                fullName: fullName.trim(),
                email: email.trim(),
            });

            if (result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                setSuccess(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="enroll-backdrop" onClick={onCancel}>
                <div className="enroll-card enroll-card--success" ref={cardRef}>
                    <div className="enroll-success-icon">&#10003;</div>
                    <h3 className="enroll-card__title">You're in!</h3>
                    <p className="enroll-card__subtitle">
                        We'll send a confirmation to <strong>{email}</strong>.
                    </p>
                    <button className="enroll-btn enroll-btn--primary" onClick={onCancel}>
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="enroll-backdrop" onClick={handleBackdropClick}>
            <div className="enroll-card" ref={cardRef} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                    <h3 className="enroll-card__title">Join the workshop</h3>
                    <p className="enroll-card__subtitle">
                        We'll email your confirmation and receipt.
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
                            Email for confirmation
                        </label>
                        <input
                            id="enroll-email"
                            type="email"
                            className={`enroll-field__input${emailTouched && email && !emailValid ? ' enroll-field__input--invalid' : ''}`}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => setEmailTouched(true)}
                            placeholder="e.g. alex@email.com"
                            autoComplete="email"
                            required
                        />
                        {emailTouched && email && !emailValid && (
                            <span className="enroll-field__hint">
                                Please enter a valid email
                            </span>
                        )}
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
