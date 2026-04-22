// Phase 2 validation for the public enrollment form: mirrors the backend
// "email OR phone" contract as a client-side gate. The backend is still the
// source of truth — see
// knowledge/plans/plan--admin--event-enrollments-management.md Phase 2.

import { describe, expect, it } from 'vitest';

import { evaluateEnrollmentFormInput } from '../enrollmentFormValidation';

describe('evaluateEnrollmentFormInput', () => {
    it('rejects when name is empty even if contact is present', () => {
        const v = evaluateEnrollmentFormInput({
            fullName: '   ',
            email: 'a@b.co',
            phone: '',
        });
        expect(v.nameValid).toBe(false);
        expect(v.canSubmit).toBe(false);
    });

    it('accepts email-only', () => {
        const v = evaluateEnrollmentFormInput({
            fullName: 'Alice',
            email: 'alice@example.com',
            phone: '',
        });
        expect(v.hasEmail).toBe(true);
        expect(v.hasPhone).toBe(false);
        expect(v.emailMalformed).toBe(false);
        expect(v.contactMissing).toBe(false);
        expect(v.canSubmit).toBe(true);
    });

    it('accepts phone-only', () => {
        const v = evaluateEnrollmentFormInput({
            fullName: 'Bob',
            email: '',
            phone: '+1-555-0100',
        });
        expect(v.hasEmail).toBe(false);
        expect(v.hasPhone).toBe(true);
        expect(v.contactMissing).toBe(false);
        expect(v.canSubmit).toBe(true);
    });

    it('accepts both email and phone', () => {
        const v = evaluateEnrollmentFormInput({
            fullName: 'Carol',
            email: 'carol@example.com',
            phone: '+1-555-0200',
        });
        expect(v.canSubmit).toBe(true);
    });

    it('rejects when neither email nor phone provided', () => {
        const v = evaluateEnrollmentFormInput({
            fullName: 'Dan',
            email: '',
            phone: '',
        });
        expect(v.contactMissing).toBe(true);
        expect(v.canSubmit).toBe(false);
    });

    it('treats whitespace-only contact values as missing', () => {
        const v = evaluateEnrollmentFormInput({
            fullName: 'Dan',
            email: '   ',
            phone: '\t',
        });
        expect(v.hasEmail).toBe(false);
        expect(v.hasPhone).toBe(false);
        expect(v.contactMissing).toBe(true);
        expect(v.canSubmit).toBe(false);
    });

    it('rejects malformed email even when phone is also present', () => {
        const v = evaluateEnrollmentFormInput({
            fullName: 'Eve',
            email: 'not-an-email',
            phone: '+1-555-0100',
        });
        expect(v.emailMalformed).toBe(true);
        expect(v.canSubmit).toBe(false);
    });

    it('accepts when email is empty and phone is provided (email format not checked)', () => {
        const v = evaluateEnrollmentFormInput({
            fullName: 'Frank',
            email: '',
            phone: '+1-555-0100',
        });
        expect(v.emailMalformed).toBe(false);
        expect(v.canSubmit).toBe(true);
    });
});
