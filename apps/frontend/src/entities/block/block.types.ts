import { ISODate, Localized } from '@/entities/common';

//*************** Legacy ***************/

/******************* End of Legacy ********************/

export type BlockEditorMode = 'create' | 'edit';
export const CTA_TYPES = ['stream', 'external', 'event'];
export type CtaTypes = (typeof CTA_TYPES)[number];

export const BLOCK_KINDS = ['gallery', 'text', 'cta'] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export type ItemPosition =
    | 'LUC'
    | 'LBC'
    | 'RUC'
    | 'RBC'
    | 'LS'
    | 'RS'
    | 'Left'
    | 'Center'
    | 'Right'
    | 'Up'
    | 'Bottom';

export const GALLERY_LAYOUTS = [
    'single',
    'pairHorizontal',
    'pairVertical',
    'triptychLeft',
    'triptychRight',
    'triptychHorizontal',
] as const;
export type GalleryLayout = (typeof GALLERY_LAYOUTS)[number];
export type BlockLifecycle = 'template' | 'draft' | 'saved';

interface BlockBase {
    id: string;
    blockKind: BlockKind;
    lifecycle: BlockLifecycle;
    isTemplate?: boolean;
    tags?: string[] | undefined;
    dateCreated: ISODate;
    caption?: Localized;
}

export interface GalleryBlock extends BlockBase {
    blockKind: 'gallery';
    layout: GalleryLayout;
    items: GalleryBlockItem[];
}

export interface GalleryBlockItem {
    artId: string;
    position: ItemPosition;
    caption?: Localized;
}

export interface TextBlock extends BlockBase {
    blockKind: 'text';
    title?: Localized | undefined;
    body: Localized | undefined;
    variant?: 'full' | 'narrow' | 'quote' | undefined;
}

interface CtaTargetStream {
    type: 'stream';
    slug?: string; // например, 'mixart' или 'event-rome-workshop'
}

interface CtaTargetExternal {
    type: 'external';
    url?: string; // например, ссылка на оплату
}

interface CtaTargetEvent {
    type: 'event';
    eventId: string; // пригодится, когда заведём сущность Event
}

export type CtaTarget = CtaTargetStream | CtaTargetExternal | CtaTargetEvent;

export interface CtaBlock extends BlockBase {
    blockKind: 'cta';
    title: Localized | undefined; // «Записаться на воркшоп»
    body?: Localized | undefined; // краткое описание
    buttonLabel: Localized | undefined; // «Записаться», «Подробнее»
    target: CtaTarget | undefined;
}

export type Block = GalleryBlock | TextBlock | CtaBlock;
