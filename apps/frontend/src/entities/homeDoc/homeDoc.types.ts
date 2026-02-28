// entities/homeDoc/homeDoc.types.ts

export type HomeStreamRef = {
    kind: 'streamRef';
    streamSlug: string;
    size?: 'S' | 'M' | 'L';
    thumbOverrideUrl?: string;
};

export type HomeBlockRef = {
    kind: 'blockRef';
    blockId: string;
    size?: 'S' | 'M' | 'L';
};

export type HomeItem = HomeStreamRef | HomeBlockRef;

export type HomeDoc = {
    items: HomeItem[];
    version: number;
    createdAt: string;
    updatedAt: string;
};
