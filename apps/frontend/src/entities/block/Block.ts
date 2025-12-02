import { ISODate, Localized } from '@/entities/common';

//*************** Legacy ***************/

/******************* End of Legacy ********************/

export type BlockEditorMode = 'create' | 'edit';

export type BlockKind = 'gallery' | 'text' | 'cta';
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

export type GalleryLayout =
    | 'single'
    | 'pairHorizontal'
    | 'pairVertical'
    | 'triptychLeft'
    | 'triptychRight'
    | 'triptychHorizontal';

interface BlockBase {
    id: string;
    blockKind: BlockKind;
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
    slug: string; // например, 'mixart' или 'event-rome-workshop'
}

interface CtaTargetExternal {
    type: 'external';
    url: string; // например, ссылка на оплату
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
