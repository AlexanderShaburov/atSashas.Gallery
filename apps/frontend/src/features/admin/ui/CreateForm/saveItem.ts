// features/admin/ui/CreateForm/saveItem.ts

import type { ArtItemJSON, PriceJSON } from '@/entities/art';
import type { Dimensions, Localized } from '@/entities/common';
import type { CreateFormValues } from '@/features/admin/ui/CreateForm/CreateForm';
type BuildParams = {
    form: CreateFormValues;
    imageId: string;
    previewBasename?: string;
};

function normOrNull<T>(v: T | undefined | null): T | null | undefined {
    return v === undefined ? undefined : v === '' ? null : v;
}

function validateLocalized(obj?: Localized): Localized {
    return !!obj && Object.keys(obj).length > 0 ? obj : { en: '' };
}

export function buildArtItemJSON({ form, imageId, previewBasename }: BuildParams): ArtItemJSON {
    const techniques: string[] = [
        ...(form.category ? [form.category] : []),
        ...(form.technique ? [form.technique] : []),
    ];

    const price: PriceJSON | null | undefined =
        form.price && form.price.amount != null && form.price.currency
            ? { amount: form.price.amount, currency: form.price.currency }
            : undefined;
    const dims: Dimensions | undefined =
        form.dimensions && form.dimensions?.width && form.dimensions.height
            ? form.dimensions
            : undefined;

    const basename = previewBasename ?? imageId;
    return {
        id: imageId,
        title: validateLocalized(form.title),
        dateCreated: form.dateCreated ?? undefined,
        category: form.category,
        techniques: form.technique,
        price: price,
        availability: form.availability,
        series: form.series ?? '',
        tags: form.tags && form.tags.length ? form.tags : undefined,
        notes: normOrNull(form.notes) ?? undefined,
        images: {
            alt: validateLocalized(form.alt),
            preview: {
                avif: `arts/previews/${basename}.avif`,
                webp: `arts/previews/${basename}.webp`,
                jpeg: `arts/previews/${basename}.jpeg`,
            },
            full: `arts/fullsize/${basename}.jpg`,
        },
        dimensions: dims,
    };
}
