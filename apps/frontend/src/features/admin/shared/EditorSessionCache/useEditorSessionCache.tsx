import { Block } from '@/entities/block';
import { StreamData } from '@/entities/stream';
import { useSyncExternalStore } from 'react';
import { editorSessionCache } from './editorSessionCache.store';
import { BlockEditEntry, StreamEditEntry } from './jumpCache.types';

export function useStreamSessionActions(streamId: string | undefined) {
    if (!streamId) return undefined;
    return {
        ensure: (snapshot: StreamData) => editorSessionCache.ensureStream(streamId, snapshot),
        updateDraft: (updater: (d: StreamData) => StreamData) =>
            editorSessionCache.updateStreamDraft(streamId, updater),
        commit: () => editorSessionCache.commit('stream', streamId),
        clear: () => editorSessionCache.clear('stream', streamId),
        setUi: (uiPatch: Partial<NonNullable<StreamEditEntry['ui']>>) =>
            editorSessionCache.setStreamUi(streamId, uiPatch),
    };
}
export function useBlockSessionActions(blockId: string) {
    if (!blockId) return undefined;
    return {
        ensure: (snapshot: Block) => editorSessionCache.ensureBlock(blockId, snapshot),
        updateDraft: (updater: (d: Block) => Block) =>
            editorSessionCache.updateBlockDraft(blockId, updater),
        commit: () => editorSessionCache.commit('block', blockId),
        clear: () => editorSessionCache.clear('block', blockId),
    };
}

export function useEditorCacheMeta(): { size: number; anyDirty: boolean } {
    return useSyncExternalStore(
        editorSessionCache._subscribe,
        () => editorSessionCache.getSnapshot(),
        () => editorSessionCache.getSnapshot(),
    );
}

export function useStreamSession(id: string): StreamEditEntry | undefined {
    return useSyncExternalStore(
        editorSessionCache._subscribe,
        () => editorSessionCache.getStreamSnapshot(id),
        () => editorSessionCache.getStreamSnapshot(id),
    );
}
export function useBlockSession(id: string): BlockEditEntry | undefined {
    return useSyncExternalStore(
        editorSessionCache._subscribe,
        () => editorSessionCache.getBlockSnapshot(id),
        () => editorSessionCache.getBlockSnapshot(id),
    );
}
