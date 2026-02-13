import {
    StreamData,
    StreamIndexItem,
    StreamScreenMode,
    StreamScreenModeStack,
} from '@/entities/stream';
import { StreamMetadata } from '@/entities/stream/streamApi.types';
import { PublicStreamData } from '@/entities/publicStream';
import { ThreeDotCommand } from '@/shared/ui/ThreeDotMenu/threeDot.types';

export type StreamEditorSession = {
    selectedStreamId: string | undefined;
    streamsIndex: StreamIndexItem[] | [];
    draft: StreamData | undefined;
    isLoading: boolean;
    isSaving: boolean;
    isValid: boolean;
    isDirty: boolean;
    isJourney: boolean;
    isPublished: boolean;
    publicStream: PublicStreamData | null;
    save: () => void;
    onApply: () => void;
    addBlock: (pos: number) => void;
    pushMode: (n: StreamScreenMode) => void;
    onEscape: () => void;
    currentStack: StreamScreenModeStack;
    selectStream: (id: string) => void;
    createNewStream: () => void;
    delStream: (id: string) => void;
    updateTags: (next: string[]) => void;
    threeDotHandler: (command: ThreeDotCommand) => void;
    editBlock: (id: string) => void;
    editMetadata: () => void;
    commitMetaEditor: (req: StreamMetadata) => Promise<void>;
    publishStream: () => Promise<void>;
    unpublishStream: () => Promise<void>;
};
