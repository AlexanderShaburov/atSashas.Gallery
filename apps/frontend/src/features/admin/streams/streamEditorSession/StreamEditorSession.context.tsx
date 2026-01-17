// src/features/admin/streams/streamEditorSession/StreamEditorSession.context.tsx

import { StreamData, StreamIndexItem, type StreamScreenMode } from '@/entities/stream';
import { SaveLifecycle, StreamScreenModeStack } from '@/entities/stream/stream-editor-screen.types';
import { useArrival, useDispatch } from '@/features/admin/shared/transporter/transporter';
import { StreamEditorCtx } from '@/features/admin/streams/hooks/useStreamEditor';
import { validateStreamForm } from '@/features/admin/streams/utils';
import { deepEqual } from '@/shared/lib/checkers/checkers';
import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { generateId } from '@/shared/lib/id/generateId';
import {
    JourneyTicket,
    ReturnAddress,
    ReturnCommand,
    ToAddress,
} from '@/shared/nav/journeyStack.types';
import { useUnsavedChanges } from '@/shared/state';
import { unsavedChangesStore } from '@/shared/state/unsavedChanges.store';
import { useSessionDataStore } from '@/shared/state/useEditorSessionsDataStore';
import { ThreeDotCommand } from '@/shared/ui/ThreeDotMenu/threeDot.types';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
    OkJumpResult,
    resolveStreamBootstrapData,
    validateStreamReturnBootstrap,
} from './bootstrap';
import {
    createNewStreamDraft,
    deleteStream,
    loadStreamsIndex,
    openStream,
    updateStream,
} from './data/streamEditorSession.utils';
import { assertReturnCommand } from './guards/streamEditorSession.guards';
import type { StreamEditorSession } from './stream-editor-session.types';
import { EditorKey } from '@/shared/nav';

type ProviderProps = { children: ReactNode };
type PendingFocus = { kind: 'blockId'; id: string } | null;

const SELECT_MODE: StreamScreenMode = { kind: 'select' };

export function StreamEditorSessionProvider({ children }: ProviderProps) {
    // ****************** UI LAYER ******************

    // Mode of stream screen
    // Stack of mode sequence instead of screenMode
    // const [screenMode, setScreenMode] = useState<StreamScreenMode>({ kind: 'select' });
    const [modeStack, setModeStack] = useState<StreamScreenMode[]>([{ kind: 'select' }]);

    // Id of selected stream: ?????????????????
    const [selectedStreamId, setSelectedStreamId] = useState<string | undefined>(undefined);

    // Streams list object
    const [streamsIndex, setStreamsIndex] = useState<StreamIndexItem[]>([]);
    // Saving lifecycle -> all about SAVING
    const [lifecycle, setLifecycle] = useState<SaveLifecycle>({ saveState: 'idle' });
    // isLoading flag
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [pendingFocus, setPendingFocus] = useState<PendingFocus>(null);

    // ****************** EDITOR DATA EXTRACTION (EXTERNAL STORE) ******************

    // Read saved editor values from the store:
    const key = selectedStreamId
        ? ({ kind: 'stream', id: selectedStreamId } as EditorKey)
        : undefined;
    const sessionData = useSessionDataStore<StreamData>(key);
    const { storeData, setDraft, commit } = sessionData;
    const draft = storeData?.draft;
    const snapshot = storeData?.snapshot;

    // ************* NAVIGATION *************

    // read ticket getter
    const arrival = useArrival();
    const dispatch = useDispatch();
    //
    //

    // ************* STATE LOGIC *************

    const isValid = useMemo(() => (draft ? validateStreamForm(draft) : false), [draft]);

    const scope = useMemo(
        () => (selectedStreamId ? ({ kind: 'stream', id: selectedStreamId } as const) : null),
        [selectedStreamId],
    );
    const dirtyStoreState = useUnsavedChanges(scope ?? { kind: 'stream', id: '__none__' });

    const isDirty = useMemo(() => {
        if (!draft) return false;
        return !deepEqual(snapshot, draft);
    }, [snapshot, draft]);
    // Synchronize local isDirty and unsavedChangesStore:
    useEffect(() => {
        if (!scope) return;

        if (isDirty !== dirtyStoreState) {
            unsavedChangesStore.setDirty(scope, isDirty);
        }
    }, [scope, isDirty, dirtyStoreState]);

    // unsavedChangesStore cleanUp:
    useEffect(() => {
        if (!scope) return;

        return () => unsavedChangesStore.clear(scope);
    }, [scope]);

    const isSaving = useMemo(() => {
        return lifecycle.saveState === 'saving';
    }, [lifecycle]);
    // ************* STATE LOGIC END *************

    // ************** MODE STACK CONTROL **************

    const pushMode = useCallback((next: StreamScreenMode) => {
        setModeStack((s) => (s[s.length - 1]?.kind === next.kind ? s : [...s, next]));
    }, []);

    const onEscape = useCallback(() => {
        setModeStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    }, []);

    const currentStack: StreamScreenModeStack = useMemo(() => {
        return {
            mode: modeStack[modeStack.length - 1] ?? SELECT_MODE,
            onEscape: onEscape,
        };
    }, [modeStack, onEscape]);

    // ************** MODE STACK CONTROL END **************

    // Reset session helpers:

    const resetSelectSession = useCallback(() => {
        setSelectedStreamId(undefined);
        pushMode({ kind: 'select' });
    }, [pushMode]);

    const renewStreamsIndex = useCallback(async () => {
        try {
            setIsLoading(true);
            const lst = await loadStreamsIndex();
            if (!lst) throw new Error('Streams list loading error');
            setStreamsIndex(lst);
        } catch (err) {
            console.error(`StreamEditorSession error: ${err}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const applyInsertBlock = (
        draft: StreamData,
        command: ReturnCommand,
        luggage: OkJumpResult,
    ): void => {
        assertReturnCommand('streamInsertBlock', command, luggage);

        let index = -1;
        switch (command.insertAt.kind) {
            case 'afterBlockId': {
                const targetId = command.insertAt.afterBlockId;
                index = draft.blockIds.findIndex((b) => b === targetId);
                if (index < 0) {
                    throw new Error(`afterBlockId not found: ${targetId}`);
                }
                index = index + 1;
                break;
            }
            case 'index': {
                index = command.insertAt.index;
                break;
            }
        }
        if (index < 0 || index > draft.blockIds.length) {
            throw new Error(`applyInsertBlock can't define new block position`);
        }

        const newBlocks = [
            ...draft.blockIds.slice(0, index),
            luggage.id,
            ...draft.blockIds.slice(index),
        ];
        setDraft({ ...draft, blockIds: newBlocks });
    };

    const applyReplaceBlock = (
        draft: StreamData,
        command: ReturnCommand,
        luggage: OkJumpResult,
    ): void => {
        assertReturnCommand('streamReplaceBlock', command, luggage);
        const newBlockId = luggage.id;
        const replaceBlockId = command.replaceBlockId;
        const index = draft.blockIds.findIndex((b) => b === replaceBlockId);
        if (index < 0) {
            throw new Error(
                `Replaced block with id: ${replaceBlockId} not found in the current stream`,
            );
        }

        const newBlocks = [
            ...draft.blockIds.slice(0, index),
            newBlockId,
            ...draft.blockIds.slice(index + 1),
        ];
        setDraft({ ...draft, blockIds: newBlocks });
    };

    // *************** MOUNT BOOTSTRAP ***************
    /* 
    What should be done:
        - check JourneyStack useArrival for current JourneyTicket:

            - if there no ticket -> newSession
            - if 
        - if cache has value for 'stream': 
            - set selectedStreamId;
            - assign methods for selected stream
            - set modeStack to 'edit'
        - if cache has not value for 'stream':
            - renewStreamsList
            - check current mode is 'select' and if not -> clear it and set to 'select'

*/
    useEffect(() => {
        (async () => {
            // Renew streams list:
            await renewStreamsIndex();
            // check ticket if we just return from the journey
            const ticket = arrival('stream');
            // if no ticket -> it is new session form zero
            if (!ticket) {
                // IMPORTANT
                // ??????????????????????????????????????????? !!!!!!!!!!!!!!!!!!!!!!!!!
                // If we reset session shouldn't we reset editorSessionData.store values?
                resetSelectSession();
                return;
            }

            const tempId: string = ticket.returnTo.objectId;
            const bootstrapDataSet = await resolveStreamBootstrapData(tempId);
            // Get validated context data:

            const v = validateStreamReturnBootstrap(ticket, bootstrapDataSet);

            // Before complete earlier started actions we have to
            // check statStore and journeyStore matching (checked in validateStreamReturnTicket)

            const id = v.streamId;
            if (id && streamsIndex.some((s) => s.streamId === id)) setSelectedStreamId(id);
            // set screenMode to 'edit' state:
            pushMode({ kind: 'edit' });

            let focusBlockId: string | null = null;
            // when ticket is valid let's finish command started before dispatch:
            switch (v.command.kind) {
                case 'streamInsertBlock':
                    applyInsertBlock(v.storeData.draft, v.command, v.loot);
                    focusBlockId = v.loot.id;
                    break;
                case 'streamReplaceBlock':
                    applyReplaceBlock(v.storeData.draft, v.command, v.loot);
                    focusBlockId = v.loot.id;
                    break;
                case 'streamUpdateBlock':
                    focusBlockId = v.loot.id ? v.loot.id : v.command.blockId;
                    break;
            }

            if (focusBlockId) {
                setPendingFocus({ kind: 'blockId', id: focusBlockId });
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // *************** INITIATE END ***************

    // *************** SCROLLER ***************
    useEffect(() => {
        if (!pendingFocus) return;
        if (!selectedStreamId) return;

        const blockId = pendingFocus.id;

        requestAnimationFrame(() => {
            const el = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement | null;
            if (el) {
                el.scrollIntoView({ block: 'center' });
                el.classList.add(`sse_block--focus`);
                window.setTimeout(() => el.classList.remove(`sse_block--focus`), 700);
            }
            setPendingFocus(null);
        });
    }, [pendingFocus, selectedStreamId]);
    // *************** SCROLLER END ***************

    // *************** OPEN STREAM FOR EDIT ***************

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
            // Check if selected stream with id is in the list ???
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
                const stream = await openStream(s.streamId);
                setSelectedStreamId(stream.streamId);
                setDraft(stream);
                commit();
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
        [streamsIndex, pushMode, commit, setDraft],
    );
    // *************** DELETE STREAM ***************

    const delStream = useCallback(
        async (streamId: string) => {
            try {
                setLifecycle({ saveState: 'saving' });
                const res = await deleteStream(streamId);
                if (!res.ok) throw new Error(`Error deleting stream with id: ${streamId}`);
                renewStreamsIndex();
                resetSelectSession(); //!!!!!!!!!!!!!!!!!!!!!
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
        [renewStreamsIndex, resetSelectSession, pushMode],
    );

    // *************** SAVE STREAM ***************

    const save = useCallback(async () => {
        if (!draft) return;

        if (!isValid) {
            pushMode({
                kind: 'error',
                message: 'Stream form is not valid. Please fix validation errors before saving.',
                canRetry: false,
            });
            return;
        }

        try {
            setLifecycle({ saveState: 'saving' });
            await updateStream(draft);
            commit();
            await renewStreamsIndex();
        } catch (err) {
            pushMode({
                kind: 'error',
                message: `Save failed: ${String(err)}`,
                canRetry: true,
            });
        } finally {
            setLifecycle({ saveState: 'idle' });
        }
    }, [draft, isValid, pushMode, commit, renewStreamsIndex]);
    // **************** END OF CRUD ***************

    // **************** TRAVEL PART ***************

    const jumpToBlockEditor = useCallback(
        (to: ToAddress, command: ReturnCommand) => {
            if (!selectedStreamId) return;

            const returnTo: ReturnAddress = {
                editor: 'stream',
                mode: 'edit',
                objectId: selectedStreamId,
            };

            const ticket: JourneyTicket = {
                journeyId: generateId('travel'),

                destination: to,
                returnTo,

                phase: 'outbound',
                nonce: createNonce(),
                createdAt: nowIso(),

                returnEffect: command,
            };
            dispatch(ticket);
        },
        [dispatch, selectedStreamId],
    );

    const createNewStream = useCallback(() => {
        const stream = createNewStreamDraft();
        setSelectedStreamId(stream.streamId);
        setDraft(stream);
        commit();
        pushMode({ kind: 'edit' });
    }, [pushMode, commit, setDraft]);

    const updateTags = useCallback(
        (next: string[]) => {
            if (!draft) return;
            const normalized = next.map((t) => t.trim()).filter(Boolean);

            const seen = new Set<string>();
            const uniq: string[] = [];
            for (const t of normalized) {
                const key = t.toLowerCase();
                if (seen.has(key)) continue;
                seen.add(key);
                uniq.push(t);
            }
            setDraft({ ...draft, tags: uniq });
        },
        [setDraft, draft],
    );

    const editBlock = useCallback(
        (id: string) => {
            if (!selectedStreamId) return;
            const command: ReturnCommand = {
                kind: 'streamUpdateBlock',
                streamId: selectedStreamId,
                blockId: id,
            };
            const to: ToAddress = {
                editor: 'block',
                mode: 'edit',
                objectId: id,
            };
            jumpToBlockEditor(to, command);
        },
        [jumpToBlockEditor, selectedStreamId],
    );

    const addBlock = useCallback(
        (pos: number) => {
            if (!selectedStreamId) return;

            const command: ReturnCommand = {
                kind: 'streamInsertBlock',
                streamId: selectedStreamId,
                insertAt: { kind: 'index', index: pos },
            };
            const to: ToAddress = {
                editor: 'block',
                mode: 'select',
            };
            jumpToBlockEditor(to, command);
        },
        [jumpToBlockEditor, selectedStreamId],
    );

    // ****************** THREE DOT MENU *****************

    const threeDotHandler = useCallback(
        (cmd: ThreeDotCommand): void => {
            const safeDraft = draft;
            if (!safeDraft) return;

            // For stream actions we must have selected stream
            if (cmd.owner.kind === 'stream') {
                const { streamId, blockId } = cmd.owner;

                // Guard: avoid acting on stale UI if stream changed
                if (!selectedStreamId || selectedStreamId !== streamId) return;

                const idx = safeDraft.blockIds.findIndex((b) => b === blockId);
                if (idx < 0) {
                    console.warn(`threeDotHandler: blockId not found in stream: ${blockId}`);
                    return;
                }

                const focus = () => setPendingFocus({ kind: 'blockId', id: blockId });

                switch (cmd.action.kind) {
                    case 'editBlock': {
                        const command: ReturnCommand = {
                            kind: 'streamUpdateBlock',
                            streamId: selectedStreamId,
                            blockId,
                        };
                        const to: ToAddress = { editor: 'block', mode: 'edit', objectId: blockId };
                        jumpToBlockEditor(to, command);
                        return;
                    }

                    case 'insertBlock': {
                        const command: ReturnCommand =
                            cmd.action.at === 'after'
                                ? {
                                      kind: 'streamInsertBlock',
                                      streamId: selectedStreamId,
                                      insertAt: { kind: 'afterBlockId', afterBlockId: blockId },
                                  }
                                : {
                                      kind: 'streamInsertBlock',
                                      streamId: selectedStreamId,
                                      insertAt: { kind: 'index', index: idx },
                                  };

                        const to: ToAddress = { editor: 'block', mode: 'select' };
                        jumpToBlockEditor(to, command);
                        return;
                    }

                    case 'replaceBlock': {
                        const command: ReturnCommand = {
                            kind: 'streamReplaceBlock',
                            streamId: selectedStreamId,
                            replaceBlockId: blockId,
                        };

                        const to: ToAddress = { editor: 'block', mode: 'select' };
                        jumpToBlockEditor(to, command);
                        return;
                    }

                    case 'deleteBlock': {
                        const nextIds = safeDraft.blockIds.filter((b) => b !== blockId);
                        setDraft({ ...safeDraft, blockIds: nextIds });

                        // Focus neighbor (optional UX)
                        const nextFocusId = nextIds[Math.min(idx, nextIds.length - 1)] ?? null;
                        if (nextFocusId) setPendingFocus({ kind: 'blockId', id: nextFocusId });

                        return;
                    }

                    case 'shift': {
                        const dir = cmd.action.dir;
                        const swapWith = dir === 'up' ? idx - 1 : idx + 1;
                        if (swapWith < 0 || swapWith >= safeDraft.blockIds.length) return;

                        const next = [...safeDraft.blockIds];
                        const a = next[idx];
                        const b = next[swapWith];
                        if (a === undefined || b === undefined) return;
                        next[idx] = b;
                        next[swapWith] = a;
                        setDraft({ ...safeDraft, blockIds: next });
                        focus();
                        return;
                    }

                    case 'move': {
                        const pos = cmd.action.pos;

                        let targetIndex: number;
                        if (pos === 'start') targetIndex = 0;
                        else if (pos === 'end') targetIndex = safeDraft.blockIds.length - 1;
                        else targetIndex = pos;

                        // clamp
                        if (targetIndex < 0) targetIndex = 0;
                        if (targetIndex > safeDraft.blockIds.length - 1) {
                            targetIndex = safeDraft.blockIds.length - 1;
                        }

                        if (targetIndex === idx) return;

                        const next = [...safeDraft.blockIds];
                        next.splice(idx, 1);
                        next.splice(targetIndex, 0, blockId);

                        setDraft({ ...safeDraft, blockIds: next });
                        focus();
                        return;
                    }

                    default: {
                        console.warn(
                            'threeDotHandler: unsupported action for stream owner',
                            cmd.action,
                        );
                        return;
                    }
                }
            }

            // Other owners not implemented in this session yet (block/cat menus)
            console.warn(`threeDotHandler: unsupported owner kind: ${cmd.owner.kind}`, cmd);
        },
        [draft, selectedStreamId, jumpToBlockEditor, setDraft],
    );

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
