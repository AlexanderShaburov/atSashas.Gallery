import {
    StreamData,
    StreamIndexItem,
    StreamScreenMode,
    StreamScreenModeStack,
} from '@/entities/stream';
import { StreamMetadata } from '@/entities/stream/streamApi.types';
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
    save: () => void;
    onApply: () => void;
    addBlock: (pos: number) => void;
    pushMode: (n: StreamScreenMode) => void;
    onEscape: () => void;
    exit: () => void;
    currentStack: StreamScreenModeStack;
    selectStream: (id: string) => void;
    selectAndReturn: (id: string) => void;
    cancelSelect: () => void;
    createNewStream: () => void;
    delStream: (id: string) => void;
    updateTags: (next: string[]) => void;
    threeDotHandler: (command: ThreeDotCommand) => void;
    editBlock: (id: string) => void;
    editMetadata: () => void;
    commitMetaEditor: (req: StreamMetadata) => Promise<void>;
    selectThumbnail: (pendingFields?: StreamMetadata) => void;
};
