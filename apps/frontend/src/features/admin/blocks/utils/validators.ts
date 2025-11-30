import { CtaTarget } from '@/entities/block';
import { Localized } from '@/entities/common';
import { BlockFormValue } from '@/features/admin/blocks/editorSessionContext';

export function validateBlockForm(form: BlockFormValue): boolean {
    if (!form) return false;

    switch (form.blockKind) {
        case 'gallery':
            if (!form.layout) return false;
            return (
                Array.isArray(form.items) &&
                form.items.length > 0 &&
                form.items.every((item) => hasFilledString(item.artId))
            );
        case 'text':
            return hasLocalizedContent(form.body);
        case 'cta':
            return hasLocalizedContent(form.buttonLabel) && validateCtaTarget(form.target);
        default:
            return false;
    }
}

function hasLocalizedContent(value: Localized | undefined): boolean {
    if (!value) return false;
    return Object.values(value).some((text) => typeof text === 'string' && text.trim().length > 0);
}

function hasFilledString(value: string | undefined): boolean {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateCtaTarget(target: CtaTarget | undefined): boolean {
    if (!target) return false;
    switch (target.type) {
        case 'stream':
            return hasFilledString(target.slug);
        case 'external':
            return hasFilledString(target.url);
        case 'event':
            return hasFilledString(target.eventId);
        default:
            return false;
    }
}
