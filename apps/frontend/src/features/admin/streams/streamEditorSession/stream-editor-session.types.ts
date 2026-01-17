import {
    StreamData,
    StreamIndexItem,
    StreamScreenMode,
    StreamScreenModeStack,
} from '@/entities/stream';
import { ThreeDotCommand } from '@/shared/ui/ThreeDotMenu/threeDot.types';

export type StreamEditorSession = {
    selectedStreamId: string | undefined;
    streamsIndex: StreamIndexItem[] | [];
    draft: StreamData | undefined;
    isLoading: boolean;
    isSaving: boolean;
    isValid: boolean;
    isDirty: boolean;
    save: () => void;
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
};
