import { StreamData } from './stream.types';

export type StreamScreenMode =
    | { kind: 'select' }
    | { kind: 'edit' }
    | { kind: 'meta' }
    | { kind: 'reorder' }
    | { kind: 'confirmDelete'; at: number }
    | { kind: 'error'; message: string; canRetry: boolean };

export type SaveLifecycle = {
    saveState: 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
    saveError?: { message: string; details?: 'string' };
    conflict?: { server: StreamData; local: StreamData };
};

export interface StreamScreenModeStack {
    mode: StreamScreenMode;
    onEscape: () => void;
}
