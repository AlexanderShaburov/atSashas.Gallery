import { BlockKind, ItemPosition } from '@/entities/block';
import { EntityLifecycle } from '@/entities/common';
import { StreamStatus } from '@/entities/stream';

export interface Dependents {
    blocksIds: string[];
    streamsIds: string[];
}
type PreflightStream = {
    streamId: string;
    title?: string;
    status?: StreamStatus;
    updatedAt?: string;

    occurrences: Array<{
        blockId: string;
        streamBlockIndex: number; // index in StreamData.blockIds
    }>;
};
type PreflightBlock = {
    blockId: string;
    blockKind: BlockKind;
    lifecycle?: EntityLifecycle;
    isTemplate?: boolean;

    // reuse stats: how many occurrences has this block
    usageCountInStreams: number;
    usedInStreamIds?: string[];

    // only for gallery
    gallerySlots?: Array<{
        position: ItemPosition;
        itemIndex: number;
    }>;
};

export type ArtItemDependents = {
    artId: string;

    // 1) Places, where can get published: stream -> block -> gallery slots
    streams: PreflightStream[];

    // 2) All blocks, containing artId, including orphans
    blocks: PreflightBlock[];

    // 3) Short UI-gate summary
    summary: {
        streamsCount: number;
        publishedStreamsCount: number; // status === 'published'
        occurrencesCount: number; // total occurrences across streams
        blocksCount: number;
    };

    // 4) Hint if it is allowed delete without force
    policy: {
        canDeleteSafely: boolean; // true if streamsCount==0 (or occurrencesCount==0)
        requiresForce?: boolean; // true if  publishedStreamsCount>0
    };
};
