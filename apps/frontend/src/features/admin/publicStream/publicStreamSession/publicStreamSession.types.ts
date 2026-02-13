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
};
