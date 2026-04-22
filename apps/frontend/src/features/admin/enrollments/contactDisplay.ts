// features/admin/enrollments/contactDisplay.ts
//
// Pure helpers for rendering the "contact" cell on the detail roster.
// An enrollment has at least one of email / phone (enforced at the
// request layer); the admin cell shows both when available, email first.

import type { Enrollment } from '@/entities/event';

export interface ContactLine {
    kind: 'email' | 'phone';
    value: string;
}

export function contactLines(e: Pick<Enrollment, 'email' | 'phone'>): ContactLine[] {
    const out: ContactLine[] = [];
    const email = (e.email ?? '').trim();
    const phone = (e.phone ?? '').trim();
    if (email) out.push({ kind: 'email', value: email });
    if (phone) out.push({ kind: 'phone', value: phone });
    return out;
}

/** Plain-text fallback rendering used by tests and low-fidelity views. */
export function contactPlainText(e: Pick<Enrollment, 'email' | 'phone'>): string {
    return contactLines(e)
        .map((l) => l.value)
        .join(' · ');
}
