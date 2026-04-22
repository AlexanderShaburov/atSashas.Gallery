// features/admin/enrollments/ui/ActionModal.tsx
//
// Minimal modal primitive used by the enrollment action dialogs. Scoped
// to this feature — not a shared library piece. Follows the public
// EnrollmentForm backdrop pattern so the admin surface feels consistent.

import { useCallback, useEffect, useRef } from 'react';

type Props = {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    /**
     * When true, clicking outside the card or pressing Esc will not close
     * the modal. Use for submit-in-progress states to prevent accidental
     * dismissal mid-request.
     */
    busy?: boolean;
};

export function ActionModal({ title, onClose, children, busy }: Props) {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (busy) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [busy, onClose]);

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent) => {
            if (busy) return;
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
                onClose();
            }
        },
        [busy, onClose],
    );

    return (
        <div className="admin-enroll-modal" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label={title}>
            <div className="admin-enroll-modal__card" ref={cardRef} onClick={(e) => e.stopPropagation()}>
                <header className="admin-enroll-modal__header">
                    <h2 className="admin-enroll-modal__title">{title}</h2>
                    <button
                        type="button"
                        className="admin-enroll-modal__close"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </header>
                <div className="admin-enroll-modal__body">{children}</div>
            </div>
        </div>
    );
}
