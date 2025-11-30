import type { BlockKind } from '@/entities/block';
import { Block, CtaTarget, GalleryBlockItem, GalleryLayout } from '@/entities/block';
import { Localized } from '@/entities/common';
import { generateArtId } from '@/shared/lib/id/generateArtId';

type GalleryBlockFormValue = {
    id: string;
    blockKind: 'gallery';
    layout: GalleryLayout;
    tags: string[];
    dateCreated: string;
    items: GalleryBlockItem[];
};

type TextBlockFormValue = {
    id: string;
    blockKind: 'text';
    tags: string[];
    dateCreated: string;
    title?: Localized;
    body: Localized;
    variant?: 'full' | 'narrow' | 'quote' | undefined;
};

type CtaBlockFormValue = {
    id: string;
    blockKind: 'cta';
    tags: string[];
    dateCreated: string;
    title: Localized;
    body: Localized;
    buttonLabel: Localized;
    target: CtaTarget;
};

export type BlockFormValue = GalleryBlockFormValue | TextBlockFormValue | CtaBlockFormValue;

export function formToBlock(form: BlockFormValue): Block {
    switch (form.blockKind) {
        case 'gallery':
            return {
                id: form.id,
                blockKind: 'gallery',
                tags: form.tags,
                dateCreated: form.dateCreated,
                layout: form.layout,
                items: form.items,
            };
        case 'text':
            return {
                id: form.id,
                blockKind: 'text',
                tags: form.tags ? form.tags : [],
                dateCreated: form.dateCreated,
                title: form.title,
                body: form.body,
                variant: form.variant,
            };
        case 'cta':
            return {
                id: form.id,
                blockKind: 'cta',
                tags: form.tags,
                dateCreated: form.dateCreated,
                title: form.title,
                body: form.body,
                buttonLabel: form.buttonLabel,
                target: form.target,
            };
    }
}
export function blockToForm(block: Block): BlockFormValue {
    switch (block.blockKind) {
        case 'gallery':
            return {
                id: block.id,
                blockKind: 'gallery',
                layout: block.layout,
                tags: block.tags ? block.tags : [],
                dateCreated: block.dateCreated,
                items: block.items,
            };
        case 'text':
            return {
                id: block.id,
                blockKind: 'text',
                tags: block.tags ? block.tags : [],
                dateCreated: block.dateCreated,
                title: block.title ? block.title : { en: '' },
                body: block.body ? block.body : { en: '' },
                variant: block.variant,
            };
        case 'cta':
            return {
                id: block.id,
                blockKind: 'cta',
                tags: block.tags ? block.tags : [],
                dateCreated: block.dateCreated,
                title: block.title ? block.title : { en: '' },
                body: block.body ? block.body : { en: '' },
                buttonLabel: block.buttonLabel ? block.buttonLabel : { en: '' },
                target: block.target ? block.target : { type: 'stream', slug: '' },
            };
    }
}

function emptyLocalized(): Localized {
    return { en: '' };
}

export function createInitialFormForKind(kind: BlockKind, prev?: BlockFormValue): BlockFormValue {
    const base = {
        id: prev?.id ?? generateArtId('block'),
        tags: prev?.tags ?? [],
        dateCreated: prev?.dateCreated ?? new Date().toISOString(),
    };

    switch (kind) {
        case 'gallery':
            return {
                ...base,
                blockKind: 'gallery',
                layout: prev?.blockKind === 'gallery' ? prev.layout : 'single', // или твой дефолт
                items: prev?.blockKind === 'gallery' ? prev.items : [],
            };

        case 'text':
            return {
                ...base,
                blockKind: 'text',
                title: prev?.blockKind === 'text' ? prev.title : emptyLocalized(),
                body: prev?.blockKind === 'text' ? prev.body : emptyLocalized(),
                variant: prev?.blockKind === 'text' ? prev.variant : 'full',
            };

        case 'cta':
            return {
                ...base,
                blockKind: 'cta',
                title: prev?.blockKind === 'cta' ? prev.title : emptyLocalized(),
                body: prev?.blockKind === 'cta' ? prev.body : emptyLocalized(),
                buttonLabel: prev?.blockKind === 'cta' ? prev.buttonLabel : emptyLocalized(),
                target: prev?.blockKind === 'cta' ? prev.target : { type: 'stream', slug: '' },
            };
    }
}
