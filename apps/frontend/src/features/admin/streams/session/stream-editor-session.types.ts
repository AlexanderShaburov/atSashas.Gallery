import {
    StreamData,
    StreamIndexItem,
    StreamScreenMode,
    StreamScreenModeStack,
} from '@/entities/stream';

export type StreamEditorSession = {
    selectedStreamId: string | undefined;
    streamsIndex: StreamIndexItem[] | [];
    draft: StreamData;
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
    threeDotHandler: (id: string) => void;
    editBlock: (id: string) => void;
};
