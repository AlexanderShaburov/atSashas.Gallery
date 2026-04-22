// Phase 4 contact-cell rendering.

import { describe, expect, it } from 'vitest';

import { contactLines, contactPlainText } from '../contactDisplay';

describe('contactLines', () => {
    it('email only', () => {
        expect(contactLines({ email: 'alice@example.com', phone: undefined })).toEqual([
            { kind: 'email', value: 'alice@example.com' },
        ]);
    });

    it('phone only', () => {
        expect(contactLines({ email: undefined, phone: '+1-555-0100' })).toEqual([
            { kind: 'phone', value: '+1-555-0100' },
        ]);
    });

    it('both — email comes first', () => {
        expect(
            contactLines({ email: 'a@b.co', phone: '+1-555-0100' }),
        ).toEqual([
            { kind: 'email', value: 'a@b.co' },
            { kind: 'phone', value: '+1-555-0100' },
        ]);
    });

    it('trims whitespace and treats blanks as missing', () => {
        expect(
            contactLines({ email: '  a@b.co  ', phone: '   ' }),
        ).toEqual([{ kind: 'email', value: 'a@b.co' }]);
    });

    it('returns empty list when neither is provided', () => {
        expect(contactLines({ email: null as unknown as undefined, phone: null as unknown as undefined })).toEqual([]);
        expect(contactLines({ email: '', phone: '' })).toEqual([]);
    });
});

describe('contactPlainText', () => {
    it('joins lines with a separator', () => {
        expect(
            contactPlainText({ email: 'a@b.co', phone: '+1-555-0100' }),
        ).toBe('a@b.co · +1-555-0100');
    });

    it('is empty when no contact is provided', () => {
        expect(contactPlainText({ email: '', phone: '' })).toBe('');
    });
});
