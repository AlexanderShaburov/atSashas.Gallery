// Phase 5B — validation helpers for contact edit + manual create modals.

import { describe, expect, it } from 'vitest';

import {
    diffContactPatch,
    evaluateContactFormInput,
    evaluateManualCreateInput,
} from '../formValidation';

describe('evaluateContactFormInput', () => {
    const existing = { currentEmail: 'old@example.com', currentPhone: null };

    it('allows saving the unchanged record', () => {
        const v = evaluateContactFormInput({
            ...existing,
            fullName: 'Existing',
            email: 'old@example.com',
            phone: '',
            note: '',
        });
        expect(v.canSubmit).toBe(true);
        expect(v.resultingHasContact).toBe(true);
    });

    it('rejects clearing both email and phone', () => {
        const v = evaluateContactFormInput({
            ...existing,
            fullName: 'X',
            email: '',
            phone: '',
            note: '',
        });
        expect(v.resultingHasContact).toBe(false);
        expect(v.canSubmit).toBe(false);
    });

    it('allows clearing email when phone is being added', () => {
        const v = evaluateContactFormInput({
            ...existing,
            fullName: 'X',
            email: '',
            phone: '+1-555-0100',
            note: '',
        });
        expect(v.resultingHasContact).toBe(true);
        expect(v.canSubmit).toBe(true);
    });

    it('rejects malformed email in form even if phone is also present', () => {
        const v = evaluateContactFormInput({
            ...existing,
            fullName: 'X',
            email: 'not-an-email',
            phone: '+1-555-0100',
            note: '',
        });
        expect(v.emailMalformed).toBe(true);
        expect(v.canSubmit).toBe(false);
    });

    it('rejects empty fullName', () => {
        const v = evaluateContactFormInput({
            ...existing,
            fullName: '   ',
            email: 'old@example.com',
            phone: '',
            note: '',
        });
        expect(v.nameValid).toBe(false);
        expect(v.canSubmit).toBe(false);
    });
});

describe('diffContactPatch', () => {
    it('includes only the fields the admin actually touched', () => {
        const patch = diffContactPatch({
            currentEmail: 'old@example.com',
            currentPhone: null,
            fullName: 'New Name',
            email: 'old@example.com',
            phone: '',
            note: 'fresh note',
        });
        expect(patch.fullName).toBe('New Name');
        expect(patch).not.toHaveProperty('email'); // unchanged
        expect(patch).not.toHaveProperty('phone'); // unchanged (null → null)
        expect(patch.note).toBe('fresh note');
    });

    it('sends email: null when the admin clears it', () => {
        const patch = diffContactPatch({
            currentEmail: 'old@example.com',
            currentPhone: '+1-555-0100',
            fullName: 'Same',
            email: '',
            phone: '+1-555-0100',
            note: '',
        });
        expect(patch.email).toBeNull();
        expect(patch).not.toHaveProperty('phone');
    });

    it('sends phone when added to a phone-less record', () => {
        const patch = diffContactPatch({
            currentEmail: 'old@example.com',
            currentPhone: null,
            fullName: 'Same',
            email: 'old@example.com',
            phone: '+1-555-0100',
            note: '',
        });
        expect(patch.phone).toBe('+1-555-0100');
    });
});

describe('evaluateManualCreateInput', () => {
    it('email only is valid', () => {
        const v = evaluateManualCreateInput({
            fullName: 'Alice',
            email: 'a@b.co',
            phone: '',
            note: '',
        });
        expect(v.canSubmit).toBe(true);
    });

    it('phone only is valid', () => {
        const v = evaluateManualCreateInput({
            fullName: 'Bob',
            email: '',
            phone: '+1-555-0100',
            note: '',
        });
        expect(v.canSubmit).toBe(true);
    });

    it('rejects when neither is provided', () => {
        const v = evaluateManualCreateInput({
            fullName: 'Carol',
            email: '',
            phone: '',
            note: '',
        });
        expect(v.hasContact).toBe(false);
        expect(v.canSubmit).toBe(false);
    });

    it('rejects malformed email', () => {
        const v = evaluateManualCreateInput({
            fullName: 'Dan',
            email: 'not-an-email',
            phone: '',
            note: '',
        });
        expect(v.emailMalformed).toBe(true);
        expect(v.canSubmit).toBe(false);
    });

    it('rejects empty name', () => {
        const v = evaluateManualCreateInput({
            fullName: '   ',
            email: 'a@b.co',
            phone: '',
            note: '',
        });
        expect(v.nameValid).toBe(false);
        expect(v.canSubmit).toBe(false);
    });
});
