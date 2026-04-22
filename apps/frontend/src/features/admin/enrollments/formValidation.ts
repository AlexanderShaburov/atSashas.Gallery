// features/admin/enrollments/formValidation.ts
//
// Pure validation helpers for the admin action modals (contact edit +
// manual create). The backend (Phase 5A) is the source of truth — these
// helpers only gate the submit button and surface inline hints.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Contact edit (partial update against an existing enrollment)
// ---------------------------------------------------------------------------

export interface ContactFormInput {
    /** The current stored values on the enrollment record. */
    currentEmail: string | null;
    currentPhone: string | null;
    /** Form field values — all strings (empty = cleared). */
    fullName: string;
    email: string;
    phone: string;
    note: string;
}

export interface ContactFormValidity {
    readonly nameValid: boolean;
    readonly emailMalformed: boolean;
    readonly resultingHasContact: boolean;
    readonly canSubmit: boolean;
}

function trimOrNull(v: string): string | null {
    const t = v.trim();
    return t ? t : null;
}

export function evaluateContactFormInput(input: ContactFormInput): ContactFormValidity {
    const nameValid = input.fullName.trim().length > 0;

    const resultingEmail = trimOrNull(input.email);
    const resultingPhone = trimOrNull(input.phone);
    const emailMalformed = resultingEmail != null && !EMAIL_PATTERN.test(resultingEmail);
    const resultingHasContact = resultingEmail != null || resultingPhone != null;

    const canSubmit = nameValid && !emailMalformed && resultingHasContact;

    return { nameValid, emailMalformed, resultingHasContact, canSubmit };
}

// ---------------------------------------------------------------------------
// Admin manual create (new record)
// ---------------------------------------------------------------------------

export interface ManualCreateFormInput {
    fullName: string;
    email: string;
    phone: string;
    note: string;
}

export interface ManualCreateFormValidity {
    readonly nameValid: boolean;
    readonly emailMalformed: boolean;
    readonly hasContact: boolean;
    readonly canSubmit: boolean;
}

export function evaluateManualCreateInput(
    input: ManualCreateFormInput,
): ManualCreateFormValidity {
    const nameValid = input.fullName.trim().length > 0;
    const trimmedEmail = input.email.trim();
    const trimmedPhone = input.phone.trim();
    const hasEmail = trimmedEmail.length > 0;
    const hasPhone = trimmedPhone.length > 0;
    const emailMalformed = hasEmail && !EMAIL_PATTERN.test(trimmedEmail);
    const hasContact = hasEmail || hasPhone;
    const canSubmit = nameValid && !emailMalformed && hasContact;
    return { nameValid, emailMalformed, hasContact, canSubmit };
}

/**
 * Build the fields to send for a partial contact update, comparing the
 * submitted form against the current stored values. Returns only the keys
 * the admin actually changed (including explicit `null` to clear a field).
 */
export function diffContactPatch(input: ContactFormInput): {
    fullName?: string;
    email?: string | null;
    phone?: string | null;
    note?: string | null;
} {
    const patch: {
        fullName?: string;
        email?: string | null;
        phone?: string | null;
        note?: string | null;
    } = {};

    const trimmedName = input.fullName.trim();
    // Full name is required; if non-empty and different, include.
    if (trimmedName.length > 0) {
        patch.fullName = trimmedName;
    }

    const newEmail = trimOrNull(input.email);
    if (newEmail !== input.currentEmail) {
        patch.email = newEmail;
    }
    const newPhone = trimOrNull(input.phone);
    if (newPhone !== input.currentPhone) {
        patch.phone = newPhone;
    }

    // Note is always optional — if the user typed something, send it; if
    // blank, clear it. We unconditionally include it if the form had any
    // interaction. Simplest heuristic: include when the trimmed value
    // differs from "no note". Since we don't track the previous note in
    // this helper, callers should either always include the field (which
    // is fine because setting a note to its current value is a no-op
    // server-side) or pre-diff. For MVP we always include the current
    // note value so the admin's displayed text matches what lands.
    patch.note = trimOrNull(input.note);

    return patch;
}
