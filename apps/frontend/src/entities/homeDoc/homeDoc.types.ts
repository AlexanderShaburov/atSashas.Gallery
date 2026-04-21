// entities/homeDoc/homeDoc.types.ts
//
// Canonical HomeDoc composition model (Phase 6 locked).
// Block-level composition at the homepage has been retired; homepage
// tiles reference streams or event pages only.

export type HomeStreamRef = {
    kind: 'streamRef';
    streamId: string;
    /** @deprecated Backend still tolerates `size` on read for legacy on-disk data, but new writes must omit it and the frontend renderer ignores it. */
    size?: 'S' | 'M' | 'L';
    thumbOverrideUrl?: string;
};

export type HomeEventRef = {
    kind: 'eventRef';
    eventPageId: string;
};

export type HomeItem = HomeStreamRef | HomeEventRef;

export type HomeDoc = {
    items: HomeItem[];
    version: number;
    createdAt: string;
    updatedAt: string;
};
