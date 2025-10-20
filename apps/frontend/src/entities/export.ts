export interface PriceJSON {
    amount: number;
    currency: CurrencyName;
}

export interface ArtItemJSON {
    id?: string;
    title?: Localized;
    dateCreated: ISODate;
    techniques: string[];
    price?: PriceJSON | null;
    availability: Availability;
    series?: string | null;
    tags?: string[];
    notes?: string | null;
    images: ImagesJSON;
    dimensions: Dimensions;
}
export type ImageExt = 'avif' | 'webp' | 'jpeg' | 'jpg' | 'png';

export type PreviewPath = `arts/previews/${string}.${'avif' | 'webp' | 'jpeg' | 'jpg'}`;
export type FullPath = `arts/fullsize/${string}.${ImageExt}`;

export interface PreviewSources {
    avif?: PreviewPath;
    webp?: PreviewPath;
    jpeg?: PreviewPath;
}

export interface ImagesJSON {
    alt: Localized;
    preview: PreviewSources;
    full: FullPath;
}
export const LAYOUT_TYPES = ['mosaicRight', 'mosaicLeft', 'pair', 'single'];
export type Layout = (typeof LAYOUT_TYPES)[number];

export const BLOCK_TYPES = ['image', 'text'];
export type BlockType = (typeof BLOCK_TYPES)[number];

export type ImageId = string & { _brand: 'ImageId' };

export type NonEmptyArray<T> = readonly [T, ...T[]];

export interface ImageBlock {
    id: string;
    type: 'image';
    layout: Layout;
    itemIds: NonEmptyArray<ImageId>;
    blockCaption: string;
}

export interface TextBlock {
    id: string;
    type: 'text';
    noteContent: string;
    align?: 'start' | 'center' | 'end';
}

export type Block = ImageBlock | TextBlock;

export interface StreamData {
    title: string;
    blocks: Block[];
}
export type ArtCatalog = {
    catalogVersion: number;
    updatedAt: string;
    order: string[];
    items: Record<string, ArtItemJSON>;
};
export interface Dimensions {
    width: number;
    height: number;
    unit: 'cm' | 'in';
}

export type Availability = 'available' | 'reserved' | 'sold' | 'privateCollection' | 'notForSale';
export const LANG_CODES = ['en', 'ru', 'it', 'es', 'pt'] as const;
export type LangCode = (typeof LANG_CODES)[number];

export type Localized = Partial<Record<LangCode, string>>;
export const CURRENCIES = ['USD', 'EUR', 'ILS', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD'] as const;
export type CurrencyName = (typeof CURRENCIES)[number];

export interface Money {
    amount: number;
    currency: CurrencyName;
}
// YYYY-MM-DD
export type ISODate = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;
export class Tags implements Iterable<string> {
    private set = new Set<string>();

    constructor(initial?: Iterable<string>) {
        if (initial) for (const t of initial) this.add(t);
    }

    add(tag: string): this {
        const s = tag.trim();
        if (s) this.set.add(s);
        return this;
    }

    addMany(...tags: string[]): this {
        for (const t of tags) this.add(t);
        return this;
    }

    remove(tag: string): boolean {
        return this.set.delete(tag.trim());
    }

    has(tag: string): boolean {
        return this.set.has(tag.trim());
    }

    clear(): void {
        this.set.clear();
    }

    toArray(): string[] {
        return [...this.set];
    }

    [Symbol.iterator](): Iterator<string> {
        return this.set[Symbol.iterator]();
    }
}
export const THEME_TYPES = ['light', 'dark', 'system'] as const;
export type Theme_Types = (typeof THEME_TYPES)[number];

export interface StreamData {
    title: string;
    blocks: Block[];
}
