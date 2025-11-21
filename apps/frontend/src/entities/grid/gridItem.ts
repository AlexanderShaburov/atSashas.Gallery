//entities/grid/gridItem.ts:

export interface GridItem {
    id: string;
    thumbUrl: string;
    sources?: {
        avif?: string;
        webp?: string;
        jpeg?: string;
    };
    title?: string;
    badge?: string;
}
