// src/entities/block.ts

import type { Localized } from '@/entities/common';
// import type { ISODate } from '@/entities/common'; // if needed later
// import type { ArtItemJSON } from '@/entities/art'; // logical link only

// Discriminated union by `type` — matches GalleryBlock.tsx
export type BlockType = 'image' | 'text';

/**
 * Which visual layout to use for image blocks.
 * These names можно маппить на уже существующие CSS-лейауты:
 * single, pair, mosaicLeft, mosaicRight, etc.
 */
export type ImageLayout =
    | 'single' // one big image
    | 'pair' // two images side by side
    | 'triptych' // three images in a row / composition
    | 'mosaicLeft' // big left + small right stack
    | 'mosaicRight'; // big right + small left stack

export interface BlockBase {
    id: string; // stable id of this block inside stream
    type: BlockType; // 'image' | 'text'
    // In future можно добавить общие поля:
    // anchor?: string;   // for deep links
    // className?: string;
}

/**
 * Reference to image inside catalog.
 * On первом этапе можно использовать только artId,
 * а URL доставать либо на бэке, либо в резолвере на фронте.
 */
export interface ImageRef {
    artId: string; // ArtItemJSON.id
    imageKey?: string; // optional: 'main', 'detail1', 'detail2', etc.
    caption?: Localized; // optional per-image caption
}

/**
 * Block with 1–3 images in some layout.
 */
export interface ImageBlock extends BlockBase {
    type: 'image';
    layout: ImageLayout;
    items: ImageRef[]; // expected length 1–3
    label?: Localized; // optional block-level label / title
    // later можно добавить:
    // hoverInfoMode?: 'none' | 'short' | 'full';
}

/**
 * Simple text block — заголовок, цитата, параграф.
 */
export type TextAlign = 'left' | 'center' | 'right';

export interface TextBlock extends BlockBase {
    type: 'text';
    text: Localized; // already используемый тип для локализованного текста
    align?: TextAlign; // visual alignment
    kind?: 'headline' | 'paragraph' | 'quote'; // semantic style
}

/**
 * Union type used by GalleryBlock & GalleryStream.
 */
export type Block = ImageBlock | TextBlock;
