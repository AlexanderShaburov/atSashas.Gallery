// features/admin/enrollments/ui/RowActionsMenu.tsx
//
// Compact dropdown menu surfacing the five Phase 5A actions.
//
// The menu is rendered via `createPortal` into `document.body` so it is
// not clipped by the `overflow-x: auto` on the roster table container.
// Position is computed from the trigger's bounding rect and uses
// `position: fixed` — closed on scroll so a stale rect never renders the
// menu in the wrong place.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { Enrollment, EnrollmentStatus, PaymentStatus } from '@/entities/event';

import {
    canTransfer,
    humanEnrollmentStatus,
    legalNextStatuses,
} from '../actionRules';

type Props = {
    enrollment: Enrollment;
    onChangeStatus: (status: EnrollmentStatus) => void;
    onTogglePayment: (next: PaymentStatus) => void;
    onEditContact: () => void;
    onTransfer: () => void;
};

type Anchor = {
    top: number;
    left: number;
};

/** Menu width used when computing horizontal position. Keep in sync with CSS. */
const MENU_WIDTH = 224; // 14rem
const VIEWPORT_MARGIN = 8;

function computeAnchor(triggerRect: DOMRect): Anchor {
    const top = triggerRect.bottom + 4;
    // Right-align to the trigger; clamp to viewport.
    const preferredLeft = triggerRect.right - MENU_WIDTH;
    const minLeft = VIEWPORT_MARGIN;
    const maxLeft = Math.max(minLeft, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN);
    const left = Math.min(Math.max(preferredLeft, minLeft), maxLeft);
    return { top, left };
}

export function RowActionsMenu({
    enrollment,
    onChangeStatus,
    onTogglePayment,
    onEditContact,
    onTransfer,
}: Props) {
    const [open, setOpen] = useState(false);
    const [anchor, setAnchor] = useState<Anchor | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            setAnchor(null);
            return;
        }
        // Position on open + whenever the viewport changes while open.
        const place = () => {
            if (triggerRef.current) {
                setAnchor(computeAnchor(triggerRef.current.getBoundingClientRect()));
            }
        };
        place();

        const close = () => setOpen(false);
        const onDocClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                triggerRef.current?.contains(target) ||
                panelRef.current?.contains(target)
            ) {
                return;
            }
            close();
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        const onResize = () => place();

        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKey);
        window.addEventListener('resize', onResize);
        // Any scroll (including inside the roster wrap) should close —
        // cheaper and more predictable than re-anchoring to a scrolling
        // target that may leave the viewport.
        window.addEventListener('scroll', close, true);

        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', close, true);
        };
    }, [open]);

    const nextStatuses = legalNextStatuses(enrollment.status);
    const nextPayment: PaymentStatus =
        enrollment.paymentStatus === 'paid' ? 'unpaid' : 'paid';
    const paymentLabel =
        enrollment.paymentStatus === 'paid' ? 'Mark as unpaid' : 'Mark as paid';
    const transferAllowed = canTransfer(enrollment);

    const invoke = (fn: () => void) => () => {
        setOpen(false);
        fn();
    };

    const menu = anchor ? (
        <div
            ref={panelRef}
            className="admin-enroll-detail__menu-panel admin-enroll-detail__menu-panel--portal"
            role="menu"
            style={{ top: anchor.top, left: anchor.left }}
        >
            {nextStatuses.length === 0 ? (
                <div className="admin-enroll-detail__menu-hint">
                    Status is terminal — no further changes.
                </div>
            ) : (
                <div className="admin-enroll-detail__menu-group">
                    <div className="admin-enroll-detail__menu-heading">Change status</div>
                    {nextStatuses.map((s) => (
                        <button
                            key={s}
                            type="button"
                            role="menuitem"
                            className="admin-enroll-detail__menu-item"
                            onClick={invoke(() => onChangeStatus(s))}
                        >
                            → {humanEnrollmentStatus(s)}
                        </button>
                    ))}
                </div>
            )}

            <div className="admin-enroll-detail__menu-group">
                <button
                    type="button"
                    role="menuitem"
                    className="admin-enroll-detail__menu-item"
                    onClick={invoke(() => onTogglePayment(nextPayment))}
                >
                    {paymentLabel}
                </button>
                <button
                    type="button"
                    role="menuitem"
                    className="admin-enroll-detail__menu-item"
                    onClick={invoke(onEditContact)}
                >
                    Edit contact…
                </button>
                <button
                    type="button"
                    role="menuitem"
                    className="admin-enroll-detail__menu-item"
                    onClick={invoke(onTransfer)}
                    disabled={!transferAllowed}
                    title={transferAllowed ? undefined : 'Terminal enrollments cannot be transferred.'}
                >
                    Transfer…
                </button>
            </div>
        </div>
    ) : null;

    return (
        <div className="admin-enroll-detail__menu">
            <button
                ref={triggerRef}
                type="button"
                className="admin-enroll-detail__row-actions"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Enrollment actions"
            >
                ⋯
            </button>
            {open && menu ? createPortal(menu, document.body) : null}
        </div>
    );
}
