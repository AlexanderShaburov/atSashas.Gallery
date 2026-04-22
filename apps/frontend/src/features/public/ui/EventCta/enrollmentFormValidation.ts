// features/public/ui/EventCta/enrollmentFormValidation.ts
//
// Pure validation helpers for the public EnrollmentForm. Backend remains the
// source of truth (see
// knowledge/plans/plan--admin--event-enrollments-management.md Phase 2);
// these helpers only gate the submit button and surface inline hints.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EnrollmentFormInput {
    fullName: string;
    email: string;
    phone: string;
}

export interface EnrollmentFormValidity {
    readonly nameValid: boolean;
    readonly hasEmail: boolean;
    readonly hasPhone: boolean;
    readonly emailMalformed: boolean;
    readonly contactMissing: boolean;
    readonly canSubmit: boolean;
}

export function evaluateEnrollmentFormInput(
    input: EnrollmentFormInput,
): EnrollmentFormValidity {
    const nameValid = input.fullName.trim().length > 0;

    const trimmedEmail = input.email.trim();
    const trimmedPhone = input.phone.trim();
    const hasEmail = trimmedEmail.length > 0;
    const hasPhone = trimmedPhone.length > 0;

    const emailMalformed = hasEmail && !EMAIL_PATTERN.test(trimmedEmail);
    const contactMissing = !hasEmail && !hasPhone;

    const canSubmit = nameValid && !contactMissing && !emailMalformed;

    return {
        nameValid,
        hasEmail,
        hasPhone,
        emailMalformed,
        contactMissing,
        canSubmit,
    };
}
