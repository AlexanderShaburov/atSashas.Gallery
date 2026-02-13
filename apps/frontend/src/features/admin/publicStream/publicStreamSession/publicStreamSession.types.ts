// features/admin/publicStream/publicStreamSession/publicStreamSession.types.ts

import type { PublicStreamData } from '@/entities/publicStream';
import type { StreamIndexItem } from '@/entities/stream';

export type PublicStreamSession = {
    /** Current PublicStream data */
    publicStream: PublicStreamData | null;

    /** All available streams from index */
    availableStreams: StreamIndexItem[];

    /** Loading state */
    isLoading: boolean;

    /** Saving state */
    isSaving: boolean;

    /** Has unsaved changes */
    isDirty: boolean;

    /** Selected stream IDs for batch operations */
    selectedIds: Set<string>;

    /** Add stream to PublicStream */
    addStream: (streamId: string) => void;

    /** Remove stream from PublicStream */
    removeStream: (streamId: string) => void;

    /** Reorder streams (pass new ordered list) */
    reorderStreams: (streamIds: string[]) => void;

    /** Save changes */
    save: () => Promise<void>;

    /** Discard changes and reload */
    discard: () => void;

    /** Navigate to stream editor */
    editStream: (streamId: string) => void;

    /** Exit PublicStream editor */
    exit: () => void;

    /** Toggle stream selection for batch operations */
    toggleSelection: (streamId: string) => void;

    /** Select all available streams */
    selectAll: () => void;

    /** Deselect all streams */
    deselectAll: () => void;

    /** Publish all selected streams */
    publishSelected: () => void;

    /** Unpublish all selected streams */
    unpublishSelected: () => void;
};
