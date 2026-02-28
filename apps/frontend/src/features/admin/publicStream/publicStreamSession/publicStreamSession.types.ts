// features/admin/publicStream/publicStreamSession/publicStreamSession.types.ts

import type { Block } from '@/entities/block';
import type { HomeDoc, HomeItem } from '@/entities/homeDoc';
import type { StreamIndexItem } from '@/entities/stream';

export type PublicStreamSession = {
    /** Current HomeDoc data (draft) */
    homeDoc: HomeDoc | null;

    /** All available streams from index */
    availableStreams: StreamIndexItem[];

    /** All available blocks from collection */
    availableBlocks: Block[];

    /** Loading state */
    isLoading: boolean;

    /** Saving state */
    isSaving: boolean;

    /** Has unsaved changes */
    isDirty: boolean;

    /** Add stream ref to HomeDoc */
    addStream: (streamSlug: string) => void;

    /** Navigate to Block editor via Journey to select/create a block */
    addBlockViaJourney: () => void;

    /** Remove item at index from HomeDoc */
    removeItem: (index: number) => void;

    /** Reorder items (pass new ordered list) */
    reorderItems: (items: HomeItem[]) => void;

    /** Set item size at index */
    setItemSize: (index: number, size: 'S' | 'M' | 'L') => void;

    /** Save changes */
    save: () => Promise<void>;

    /** Discard changes and reload */
    discard: () => void;

    /** Preview HomeDoc in a new tab */
    preview: () => void;

    /** Streams not yet added to HomeDoc (filtered from available) */
    nonPublicStreams: StreamIndexItem[];

    /** Navigate to stream editor via Journey */
    editStreamViaJourney: (streamId: string) => void;

    /** Exit editor */
    exit: () => void;
};
