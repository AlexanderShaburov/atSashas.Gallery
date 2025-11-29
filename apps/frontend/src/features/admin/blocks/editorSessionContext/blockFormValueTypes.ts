import { Block, CtaTarget, GalleryBlockItem, GalleryLayout } from '@/entities/block/Block';
import { Localized } from '@/entities/common';

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
    title: Localized;
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
                tags: form.tags,
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
