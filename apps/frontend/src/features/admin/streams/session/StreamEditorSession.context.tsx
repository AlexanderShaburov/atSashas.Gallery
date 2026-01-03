import { StreamData, StreamIndexItem, type StreamScreenMode } from '@/entities/stream';
import { SaveLifecycle, StreamScreenModeStack } from '@/entities/stream/stream-editor-screen.types';
import type { EditorWorkspaceContextValue } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { StreamEditorCtx } from '@/features/admin/streams/hooks/useStreamEditor';
import { validateStreamForm } from '@/features/admin/streams/utils';
import { deepEqual } from '@/shared/lib/checkers/checkers';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StreamEditorSession } from './stream-editor-session.types';
import {
    createNewStreamDraft,
    deleteStream,
    loadStreamsIndex,
    openStream,
} from './streamEditorSession.utils';

type ProviderProps = { children: ReactNode };

export function StreamEditorSessionProvider({ children }: ProviderProps) {
    const gCtxt: EditorWorkspaceContextValue = useEditorWorkspace();

    // Mode of stream screen
    // const [screenMode, setScreenMode] = useState<StreamScreenMode>({ kind: 'select' });
    // Id of selected stream:
    const [selectedStreamId, setSelectedStreamId] = useState<string | undefined>(undefined);
    // Current unsaved stream under edition
    const [draft, setDraft] = useState<StreamData>(createNewStreamDraft());
    // Streams list object
    const [streamsIndex, setStreamsIndex] = useState<StreamIndexItem[]>([]);
    // Saving lifecycle
    const [lifecycle, setLifecycle] = useState<SaveLifecycle>({ saveState: 'idle' });
    // Stack of mode sequence
    const [modeStack, setModeStack] = useState<StreamScreenMode[]>([{ kind: 'select' }]);
    // isLoading flag
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // Stream state picture on last save (?? the same as base)
    const snapshot = useRef<StreamData>(createNewStreamDraft());

    // UI driven states:
    const [focusedStreamIndex, setFocusedStreamIndex] = useState<number | undefined>(undefined);
    const [selectedStreamBlockIds, setSelectedStreamBlockIds] = useState<Set<string>>();
    const [hoveredStreamBlockId, setHoveredStreamBlockId] = useState<string | undefined>(undefined);

    const [insertAtIndex, setInsertAtIndex] = useState<number | undefined>(undefined);
    const [insertMode, setInsertMode] = useState<'before' | 'after' | 'replace'>('before');
    // Undo / Redo:
    const [history, setHistory] = useState<StreamData[]>([]);

    // Save lifecycle state:

    // ************* STATE LOGIC *************

    const isValid = useMemo(() => (draft ? validateStreamForm(draft) : false), [draft]);

    const isDirty = useMemo(() => {
        if (!draft) return true;
        return !deepEqual(snapshot.current, draft);
    }, [draft]);

    const isSaving = useMemo(() => {
        return lifecycle.saveState === 'saving';
    }, [lifecycle]);
    // ************* STATE LOGIC END *************

    // ************** STACK CONTROL **************

    const pushMode = useCallback((next: StreamScreenMode) => {
        setModeStack((s) => (s[s.length - 1] === next ? s : [...s, next]));
    }, []);

    const onEscape = useCallback(() => {
        setModeStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    }, []);
    const currentStack: StreamScreenModeStack = useMemo(() => {
        return {
            mode: modeStack[modeStack.length - 1] ?? { kind: 'select' },
            onEscape: onEscape,
        };
    }, [modeStack, onEscape]);

    // ************** STACK CONTROL END **************

    // Reset session helper:
    const resetSession = useCallback(() => {
        setSelectedStreamId(undefined);
        setDraft(createNewStreamDraft());
        snapshot.current = createNewStreamDraft();
        pushMode({ kind: 'select' });
    }, []);

    const renewStreamsIndex = useCallback(async () => {
        try {
            setIsLoading(true);
            const lst = await loadStreamsIndex();
            if (!lst) throw new Error('Streams list loading error');
            resetSession();
            setStreamsIndex(lst);
        } catch (err) {
            console.error(`StreamEditorSession error: ${err}`);
        } finally {
            setIsLoading(true);
        }
    }, []);

    // *************** INITIATE ***************

    useEffect(() => {
        (async () => {
            resetSession();
            await renewStreamsIndex();
        })();
    }, [resetSession, renewStreamsIndex]);

    const selectStream = useCallback(
        async (id: string) => {
            if (!streamsIndex) {
                pushMode({
                    kind: 'error',
                    message:
                        'Attempt to find stream while streamIndex or streamIndex.streams is undefined',
                    canRetry: false,
                });
                return;
            }
            const s = streamsIndex.find((s) => s.streamId === id);
            if (!s) {
                pushMode({
                    kind: 'error',
                    message: `Stream with id: ${id} can't be found`,
                    canRetry: false,
                });
                return;
            }
            try {
                setIsLoading(true);
                const stream = await openStream(s?.streamId);
                setSelectedStreamId(stream.streamId);
                setDraft(stream);
                snapshot.current = stream;
                pushMode({ kind: 'edit' });
            } catch (err) {
                pushMode({
                    kind: 'error',
                    message: `Error loading stream by id: ${id} error: ${err}`,
                    canRetry: false,
                });
            } finally {
                setIsLoading(false);
            }
        },
        [streamsIndex, pushMode],
    );
    const delStream = useCallback(
        async (streamId: string) => {
            try {
                setLifecycle({ saveState: 'saving' });
                const res = await deleteStream(streamId);
                if (!res.ok) throw new Error(`Error deleting stream with id: ${streamId}`);
                renewStreamsIndex();
                resetSession();
            } catch (err) {
                pushMode({
                    kind: 'error',
                    message: String(err),
                    canRetry: true,
                });
            } finally {
                setLifecycle({ saveState: 'idle' });
            }
        },
        [renewStreamsIndex, resetSession, pushMode],
    );

    const createNewStream = useCallback(() => {
        const stream = createNewStreamDraft();
        setSelectedStreamId(stream.streamId);
        setDraft(stream);
        snapshot.current = stream;
        pushMode({ kind: 'edit' });
    }, [pushMode]);

    const updateTags = useCallback((next: string[]) => {
        const normalized = next.map((t) => t.trim()).filter(Boolean);

        const seen = new Set<string>();
        const uniq: string[] = [];
        for (const t of normalized) {
            const key = t.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            uniq.push(t);
        }
        setDraft((prev) => {
            if (!prev) return prev;
            return { ...prev, tags: uniq };
        });
    }, []);

    const threeDotHandler = useCallback((id: string) => {
        // TODO
    }, []);

    const editBlock = useCallback((id: string) => {
        // TODO
    }, []);
    const save = useCallback(() => {
        //TODO
    }, []);
    const addBlock = useCallback((pos: number) => {
        //TODO
        gCtxt.setStream(selectedStreamId);
    }, []);
    const value: StreamEditorSession = useMemo(
        () => ({
            selectedStreamId,
            streamsIndex,
            draft,
            isLoading,
            isSaving,
            isValid,
            isDirty,
            save,
            addBlock,
            pushMode,
            onEscape,
            currentStack,
            selectStream,
            createNewStream,
            delStream,
            updateTags,
            threeDotHandler,
            editBlock,
        }),
        [
            selectedStreamId,
            streamsIndex,
            draft,
            isLoading,
            isSaving,
            isValid,
            isDirty,
            save,
            addBlock,
            pushMode,
            onEscape,
            currentStack,
            selectStream,
            createNewStream,
            delStream,
            updateTags,
            threeDotHandler,
            editBlock,
        ],
    );
    return <StreamEditorCtx.Provider value={value}>{children}</StreamEditorCtx.Provider>;
}
