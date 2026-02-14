// src/features/admin/streams/streamEditorSession/StreamEditorSession.context.tsx

import { MetaIntent } from '@/entities/common/lifecycle';
import type { PublicStreamData } from '@/entities/publicStream';
import type { StreamMetadata } from '@/entities/stream';
import { StreamData, StreamIndexItem, type StreamScreenMode } from '@/entities/stream';
import { SaveLifecycle, StreamScreenModeStack } from '@/entities/stream/stream-editor-screen.types';
import { getCollection } from '@/features/admin/blocks/api/blocksApi';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { publicStreamApi } from '@/features/admin/publicStream/api/publicStreamApi';
import {
    useArrival,
    useDispatch,
    useJourneyStatus,
    useReturnHome,
} from '@/features/admin/shared/transporter/transporter';
import { StreamEditorCtx } from '@/features/admin/streams/hooks/useStreamEditor';
import { validateStreamForm } from '@/features/admin/streams/utils';
import { streamsApi } from '@/features/admin/streams/api/streamsApi';
import { deepEqual } from '@/shared/lib/checkers/checkers';
import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { generateId } from '@/shared/lib/id/generateId';
import type { JourneyHome, OkJumpResult } from '@/shared/nav';
import { EditorKey } from '@/shared/nav';
import { JourneyTicket, ReturnAddress, ReturnCommand, ToAddress } from '@/shared/nav/journey.types';
import { useUnsavedChanges } from '@/shared/state';
import { destructiveActionsStore } from '@/shared/state/destructiveActions.store';
import { editSessionsDataStore } from '@/shared/state/editorSessionsData.store';
import { unsavedChangesStore } from '@/shared/state/unsavedChanges.store';
import { useSessionDataStore } from '@/shared/state/useEditorSessionsDataStore';
import { ThreeDotCommand } from '@/shared/ui/ThreeDotMenu/threeDot.types';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveStreamBootstrapData, validateStreamReturnBootstrap } from './bootstrap';
import {
    deleteStream,
    loadStreamsIndex,
    openStream,
    requestNewStream,
    updateStream,
} from './data/streamEditorSession.utils';
import { assertReturnCommand } from './guards/streamEditorSession.guards';
import type { StreamEditorSession } from './stream-editor-session.types';

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
    // PublicStream state
    const [publicStream, setPublicStream] = useState<PublicStreamData | null>(null);

    const metaIntent = useRef<MetaIntent>({ action: 'idle' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bootstrapRef = useRef<{ pathname: string; ticket: any } | null>(null);

    // ****************** EDITOR DATA EXTRACTION (EXTERNAL STORE) ******************

    // Read saved editor values from the store:
    const key = selectedStreamId
        ? ({ kind: 'stream', id: selectedStreamId } as EditorKey)
        : undefined;
    const sessionData = useSessionDataStore<StreamData>(key);
    const { storeData, setDraft, commit } = sessionData;
    const draft = storeData?.draft;
    const snapshot = storeData?.snapshot;

    //  ?????????????? TO CHANGE ??????????????
    const gCtx = useEditorWorkspace();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const collection = gCtx.currentBlocksCollection?.blocks ?? {};
    //  ?????????????? TO CHANGE END ??????????????

    // ************* NAVIGATION *************

    // read ticket getter
    const arrival = useArrival();
    const dispatch = useDispatch();
    const returnHome = useReturnHome();
    const location = useLocation(); // For triggering bootstrap on route changes
    const isJourney = useJourneyStatus('stream');

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
        console.log(`[onEscape]: Called`);
        setModeStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    }, []);

    const currentStack: StreamScreenModeStack = useMemo(() => {
        console.log(`[currentStack]: current mode is: ${modeStack.length - 1}`);
        return {
            mode: modeStack[modeStack.length - 1] ?? SELECT_MODE,
            onEscape: onEscape,
        };
    }, [modeStack, onEscape]);

    // ************** MODE STACK CONTROL END **************

    // Reset session helpers:

    const resetSelectSession = useCallback(() => {
        // If external data store has to be cleaned here ??????
        setSelectedStreamId(undefined);
        pushMode({ kind: 'select' });
    }, [pushMode]);

    const renewStreamsIndex = useCallback(async () => {
        try {
            console.log(`[renewStreamsIndex]: Called`);

            setIsLoading(true);
            const lst = await loadStreamsIndex();
            console.log(`[renewStreamsIndex]: streams index loaded`);
            if (!lst) throw new Error('Streams list loading error');
            setStreamsIndex(lst);
        } catch (err) {
            console.error(`StreamEditorSession error: ${err}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // while hooks are undefined
    const streamStoreDirectSave = (draft: StreamData, snapshot?: StreamData) => {
        const key = { kind: 'stream', id: draft.streamId } as EditorKey;
        editSessionsDataStore.saveDraft<StreamData>(key, draft);
        if (snapshot) editSessionsDataStore.setSnapshot<StreamData>(key, draft);
        unsavedChangesStore.setDirty(key, false);
    };

    const applyInsertBlock = (
        draft: StreamData,
        command: ReturnCommand,
        luggage: OkJumpResult,
    ): void => {
        assertReturnCommand('streamInsertBlock', command, luggage);

        const { insertAt } = command;
        const clampedIdex = Math.max(0, Math.min(insertAt, draft.blockIds.length));
        const nextBlocks = [
            ...draft.blockIds.slice(0, clampedIdex),
            luggage.id,
            ...draft.blockIds.slice(clampedIdex),
        ];

        streamStoreDirectSave({ ...draft, blockIds: nextBlocks });
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
        const nextBlocks = [
            ...draft.blockIds.slice(0, index),
            newBlockId,
            ...draft.blockIds.slice(index + 1),
        ];
        streamStoreDirectSave({ ...draft, blockIds: nextBlocks });
    };

    // *************** MOUNT BOOTSTRAP ***************

    useEffect(() => {
        console.log(`[STREAM BOOTSTRAP]: Effect running, pathname=${location.pathname}`);

        // React Strict Mode protection: Only process if pathname actually changed
        if (bootstrapRef.current?.pathname === location.pathname) {
            console.log(`[STREAM BOOTSTRAP]: Skipping - already processed this pathname`);
            return;
        }

        // CRITICAL: Call arrival() synchronously FIRST, before any async operations
        // This prevents race conditions in React Strict Mode which runs effects twice
        const arrivalTicket = arrival('stream');
        console.log(`[STREAM BOOTSTRAP]: arrival('stream') returned:`, arrivalTicket);

        // Store this pathname as processed
        bootstrapRef.current = { pathname: location.pathname, ticket: arrivalTicket };

        // Now start async operations
        (async () => {
            console.log(`[STREAM BOOTSTRAP]: Current modeStack:`, modeStack);
            console.log(`[STREAM BOOTSTRAP]: Current selectedStreamId:`, selectedStreamId);

            // Renew streams list AFTER consuming the ticket
            await renewStreamsIndex();

            // Load PublicStream
            try {
                const ps = await publicStreamApi.get();
                setPublicStream(ps);
            } catch (err) {
                console.error('[STREAM BOOTSTRAP]: Failed to load PublicStream', err);
            }

            // if no ticket -> it is new session from zero
            if (!arrivalTicket) {
                console.log(`[STREAM BOOTSTRAP]: No ticket, calling resetSelectSession()`);
                resetSelectSession();
                return;
            }

            console.log(`[BOOTSTRAP]: Got ticket:`);
            console.dir(arrivalTicket);

            // Check if this is a return (has loot) or outbound (no loot)
            if (!arrivalTicket.loot) {
                // OUTBOUND: Someone navigated TO stream editor (not a return)
                console.log(`[BOOTSTRAP]: Outbound ticket - Stream editor is destination`);

                // Support outbound journey with destination.mode = 'edit'
                if (arrivalTicket.destination.mode === 'edit') {
                    const targetId = arrivalTicket.destination.objectId;
                    if (!targetId) {
                        console.error(`[BOOTSTRAP]: Outbound edit mode missing objectId`);
                        resetSelectSession();
                        return;
                    }

                    console.log(`[BOOTSTRAP]: Opening stream ${targetId} in edit mode`);

                    // Load the stream
                    await renewStreamsIndex();
                    const stream = await openStream(targetId);

                    if (!stream) {
                        console.error(`[BOOTSTRAP]: Stream ${targetId} not found`);
                        resetSelectSession();
                        return;
                    }

                    // Set up editor state
                    setSelectedStreamId(targetId);
                    const key: EditorKey = { kind: 'stream', id: targetId };
                    editSessionsDataStore.saveDraft(key, stream);
                    editSessionsDataStore.commit(key);

                    // Open in edit mode
                    pushMode({ kind: 'edit' });
                    console.log(`[BOOTSTRAP]: Stream ${targetId} opened in edit mode`);
                    return;
                }

                // Default: just reset to select mode
                resetSelectSession();
                return;
            }

            // RETURN: Returning from child editor (Block/Catalog/etc) with loot
            console.log(`[BOOTSTRAP]: Return ticket with loot - processing return`);

            const bootstrapId: string = arrivalTicket.returnTo.objectId;
            const key =
                (selectedStreamId ?? bootstrapId)
                    ? ({ kind: 'stream', id: selectedStreamId ?? bootstrapId } as EditorKey)
                    : undefined;

            setSelectedStreamId(bootstrapId);
            let storeData;
            storeData = editSessionsDataStore.get<StreamData>(key);
            if (!storeData) {
                storeData = await resolveStreamBootstrapData(bootstrapId);
            }
            console.log(`[BOOTSTRAP]: Got stored data:`);
            console.dir(storeData);

            // Validate return ticket data
            const v = validateStreamReturnBootstrap(arrivalTicket, storeData);

            console.log(`[BOOTSTRAP]: Got validated values:`);
            console.dir(v);

            const id = v.streamId;
            if (id) {
                setSelectedStreamId(id);
                console.log(`[BOOTSTRAP]: selected stream id set to : ${id}`);
            }

            // set screenMode to 'edit' state:
            console.log(`[STREAM BOOTSTRAP]: About to call pushMode({ kind: 'edit' })`);
            console.log(`[STREAM BOOTSTRAP]: Current modeStack before pushMode:`, modeStack);
            pushMode({ kind: 'edit' });
            console.log(`[STREAM BOOTSTRAP]: pushMode({ kind: 'edit' }) called`);

            let focusBlockId: string | null = null;
            // Execute the return command based on its kind:
            switch (v.command.kind) {
                case 'streamInsertBlock':
                    console.log(`[BOOTSTRAP]: streamInsertBlock branch selected`);
                    console.log('[BOOTSTRAP] selectedStreamId BEFORE set:', selectedStreamId);
                    console.log('[BOOTSTRAP] will setSelectedStreamId:', v.streamId);
                    applyInsertBlock(v.storeData.draft, v.command, v.loot);
                    focusBlockId = v.loot.id;
                    break;
                case 'streamReplaceBlock':
                    console.log(`[BOOTSTRAP]: streamReplaceBlock branch selected`);
                    applyReplaceBlock(v.storeData.draft, v.command, v.loot);
                    focusBlockId = v.loot.id;
                    break;
                case 'streamUpdateBlock':
                    console.log(`[BOOTSTRAP]: streamUpdateBlock branch selected`);
                    focusBlockId = v.loot.id ? v.loot.id : v.command.blockId;
                    break;
                case 'streamSelectThumbnail':
                    console.log(`[BOOTSTRAP]: streamSelectThumbnail - updating thumbnail`);

                    if (!v.loot?.output?.thumbUrl) {
                        console.warn('[BOOTSTRAP]: No thumbnail URL in loot');
                        break;
                    }

                    // Update draft with new thumbnail
                    if (v.storeData.draft) {
                        const updatedDraft = {
                            ...v.storeData.draft,
                            thumbnail: v.loot.output.thumbUrl,
                        };
                        streamStoreDirectSave(updatedDraft);
                        console.log(`[BOOTSTRAP]: Thumbnail updated to ${v.loot.output.thumbUrl}`);
                    }

                    // Return to metadata editor so user can see the updated thumbnail
                    // Set metaIntent to 'edit' so the form knows this is an edit operation
                    metaIntent.current = { action: 'edit' };
                    pushMode({ kind: 'meta' });
                    break;
            }

            // CRITICAL: Refresh blocks collection to include newly created/updated block
            // This ensures the stream can render the block that was just saved
            console.log(`[BOOTSTRAP]: Refreshing blocks collection...`);
            const freshCollection = await getCollection();
            gCtx.setBlocksCollection(freshCollection);
            console.log(`[BOOTSTRAP]: Blocks collection refreshed with new block`);

            if (focusBlockId) {
                setPendingFocus({ kind: 'blockId', id: focusBlockId });
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]); // Re-run when route changes (e.g., returning from journey)

    // *************** BOOTSTRAP END ***************

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
            console.log(`[StreamEditorSessionProvider][selectStream]: Called`);
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
            console.log(
                `[StreamEditorSessionProvider][selectStream]: Clicked stream with id: ${s.streamId} successfully found`,
            );

            try {
                setIsLoading(true);
                const stream = await openStream(s.streamId);
                console.log(
                    `[StreamEditorSessionProvider][selectStream]: Selected stream successfully downloaded`,
                );

                setSelectedStreamId(stream.streamId);
                console.log(`[StreamEditorSessionProvider][selectStream]: Selected stream id set`);
                streamStoreDirectSave(stream, stream);
                console.log('[selectStream] after setDraft, streamId=', stream.streamId);
                console.log(`[StreamEditorSessionProvider][selectStream]: Stream saved to store`);
                pushMode({ kind: 'edit' });
                setModeStack((s) => [...s]); // force render
                console.log(`[StreamEditorSessionProvider][selectStream]: Mode set to edit`);
            } catch (err) {
                pushMode({
                    kind: 'error',
                    message: `Error loading stream by id: ${id} error: ${err}`,
                    canRetry: false,
                });
            } finally {
                setIsLoading(false);
                console.log(`[StreamEditorSessionProvider][selectStream]: Completed`);
            }
        },
        [streamsIndex, pushMode, setSelectedStreamId],
    );
    // *************** DELETE STREAM ***************

    const delStream = useCallback(
        async (streamId: string) => {
            // Check if stream is published before deleting
            let isPublished = false;
            try {
                const deps = await streamsApi.checkDependencies(streamId);
                isPublished = deps.isPublished;
            } catch (err) {
                console.error('[delStream] Failed to check dependencies:', err);
                // Continue with deletion even if check fails
            }

            const warningMessage = isPublished
                ? '⚠️ WARNING: This stream is currently PUBLISHED in the public gallery. Deleting it will remove it from the public site.'
                : 'This will permanently delete the stream. This cannot be undone.';

            const steps = isPublished
                ? [
                      'This stream is published and visible to the public.',
                      'We will remove it from PublicStream.',
                      'We will remove the stream JSON from storage.',
                      'We will refresh the streams list.',
                  ]
                : [
                      'We will remove the stream JSON from storage.',
                      'We will refresh the streams list.',
                  ];

            destructiveActionsStore.open({
                title: isPublished ? '⚠️ Delete Published Stream' : 'Delete stream',
                message: warningMessage,
                dangerHint: isPublished
                    ? 'This stream is live on the public site!'
                    : 'Make sure it is not used as an event landing page.',
                steps,
                confirmLabel: 'Delete stream',
                run: async () => {
                    // If published, unpublish first
                    if (isPublished) {
                        try {
                            await publicStreamApi.removeStream(streamId);
                        } catch (err) {
                            console.error('[delStream] Failed to unpublish:', err);
                            // Continue with deletion anyway
                        }
                    }
                    await deleteStream(streamId);
                },
                onSuccess: () => {
                    // Clear the store data for the deleted stream
                    const key: EditorKey = { kind: 'stream', id: streamId };
                    editSessionsDataStore.clear(key);
                    unsavedChangesStore.clear(key);

                    // Refresh the streams list
                    renewStreamsIndex();

                    // Reset to select mode
                    resetSelectSession();
                },
            });
        },
        [renewStreamsIndex, resetSelectSession],
    );

    // *************** PUBLISH/UNPUBLISH STREAM ***************

    // Check if current stream is published
    const isPublished = useMemo(() => {
        if (!selectedStreamId || !publicStream) return false;
        return publicStream.streamIds.includes(selectedStreamId);
    }, [selectedStreamId, publicStream]);

    const publishStream = useCallback(async () => {
        if (!selectedStreamId || !draft) return;

        // Validate thumbnail exists
        if (!draft.thumbnail) {
            alert('Cannot publish stream without thumbnail. Please select a thumbnail first.');
            return;
        }

        try {
            console.log(`[publishStream]: Publishing stream ${selectedStreamId}`);
            const updated = await publicStreamApi.addStream(selectedStreamId);
            setPublicStream(updated);

            // No need to update stream status - being in PublicStream.streamIds
            // is what makes it "published". Status stays as 'ready'.
            console.log(`[publishStream]: Stream published successfully`);
        } catch (err) {
            console.error('[publishStream]: Failed to publish stream', err);
            alert(`Failed to publish stream: ${err}`);
        }
    }, [selectedStreamId, draft]);

    const unpublishStream = useCallback(async () => {
        if (!selectedStreamId || !draft) return;

        try {
            console.log(`[unpublishStream]: Unpublishing stream ${selectedStreamId}`);
            const updated = await publicStreamApi.removeStream(selectedStreamId);
            setPublicStream(updated);

            // No need to update stream status - removal from PublicStream.streamIds
            // is what makes it "unpublished". Status remains unchanged.
            console.log(`[unpublishStream]: Stream unpublished successfully`);
        } catch (err) {
            console.error('[unpublishStream]: Failed to unpublish stream', err);
            alert(`Failed to unpublish stream: ${err}`);
        }
    }, [selectedStreamId, draft]);

    // *************** SAVE STREAM ***************
    const popIfTopIs = useCallback((kind: StreamScreenMode['kind']) => {
        setModeStack((s) => {
            if (s.length <= 1) return s;
            const top = s[s.length - 1];
            return top?.kind === kind ? s.slice(0, -1) : s;
        });
    }, []);

    const finalizeAfterSave = useCallback(
        (savedId: string) => {
            console.log(`[StreamEditor][finalizeAfterSave]: called with streamId: ${savedId}`);
            // If in a journey, return home with the saved stream ID
            if (isJourney) {
                console.log(
                    `[StreamEditor][finalizeAfterSave]: in journey, returning home with streamId: ${savedId}`,
                );
                returnHome('stream', { ok: true, id: savedId });
            }
        },
        [isJourney, returnHome],
    );

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

        setLifecycle({ saveState: 'saving' });
        try {
            // Auto-update status: draft → ready on save
            const streamToSave = { ...draft };
            if (streamToSave.status === 'draft') {
                streamToSave.status = 'ready';
                console.log('[save]: Auto-updating status from draft to ready');
            }

            await updateStream(streamToSave);
            commit();
            await renewStreamsIndex();
            popIfTopIs('meta');
            // If in a journey, finalize and return home
            finalizeAfterSave(draft.streamId);
        } catch (err) {
            pushMode({
                kind: 'error',
                message: `Save failed: ${String(err)}`,
                canRetry: true,
            });
        } finally {
            setLifecycle({ saveState: 'idle' });
        }
    }, [draft, isValid, pushMode, commit, popIfTopIs, renewStreamsIndex, finalizeAfterSave]);

    // Apply button handler (for journey mode)
    const onApply = useCallback(() => {
        void (async () => {
            if (!isJourney) return;
            await save();
            // finalizeAfterSave is called within save() when isJourney is true
        })();
    }, [isJourney, save]);

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

            // NEW: Provide home when starting journey to BlockEditor
            const home: JourneyHome = {
                editor: 'stream',
                objectId: selectedStreamId,
            };

            dispatch(ticket, home);
        },
        [dispatch, selectedStreamId],
    );

    const jumpToCatalogForThumbnail = useCallback(() => {
        if (!selectedStreamId) return;

        const returnTo: ReturnAddress = {
            editor: 'stream',
            mode: 'edit',
            objectId: selectedStreamId,
        };

        const ticket: JourneyTicket = {
            journeyId: generateId('travel'),
            destination: {
                editor: 'catalog',
                mode: 'select',
            },
            returnTo,
            phase: 'outbound',
            nonce: createNonce(),
            createdAt: nowIso(),
            returnEffect: {
                kind: 'streamSelectThumbnail',
                streamId: selectedStreamId,
            },
        };

        const home: JourneyHome = {
            editor: 'stream',
            objectId: selectedStreamId,
        };

        dispatch(ticket, home);
    }, [dispatch, selectedStreamId]);

    // ************* METADATA EDITOR ************

    const editMetadata = useCallback(() => {
        console.log(`[StreamEditorSession][editMetadata]j: Called`);
        metaIntent.current = { action: 'edit' };
        pushMode({ kind: 'meta' });
    }, [pushMode]);

    // Switch UI to new Stream form:
    const createNewStream = useCallback(() => {
        console.log(`[StreamEditorSession]: Create new stream called`);
        resetSelectSession();
        metaIntent.current = { action: 'create' };
        pushMode({ kind: 'meta' });
    }, [pushMode, resetSelectSession]);

    const submitCreateStream = useCallback(
        async (req: StreamMetadata) => {
            console.log(`[submitCreateStream]: Called`);
            try {
                setIsLoading(true);
                const created = await requestNewStream(req);

                const createdId = created.streamId ?? req.streamId;

                await renewStreamsIndex();

                const stream = await openStream(createdId);

                setSelectedStreamId(stream.streamId);
                streamStoreDirectSave(stream);
                commit();
                popIfTopIs('meta');
                pushMode({ kind: 'edit' });
            } catch (err) {
                const msg = String(err);
                pushMode({
                    kind: 'error',
                    message: `Create stream failed: ${msg}`,
                    canRetry: true,
                });
            } finally {
                setIsLoading(false);
            }
        },
        [commit, pushMode, renewStreamsIndex, popIfTopIs],
    );

    const applyStreamMetadata = useCallback(
        (data: StreamMetadata) => {
            if (!draft) return;
            const nextDraft = {
                ...draft,
                title: data.title,
                tags: data.tags,
                description: data.description,
                thumbnail: data.thumbnail ?? draft.thumbnail ?? '',
            };
            setDraft(nextDraft);
            popIfTopIs('meta');
            metaIntent.current = { action: 'idle' };
        },
        [setDraft, draft, popIfTopIs],
    );

    const commitMetaEditor = useCallback(
        async (data: StreamMetadata) => {
            console.log(`[StreamEditorSessionProvider][commitMetaEditor] Called`);
            switch (metaIntent.current.action) {
                case 'create': {
                    console.log(
                        `[StreamEditorSessionProvider][commitMetaEditor] Create stream selected`,
                    );
                    await submitCreateStream(data);
                    break;
                }
                case 'edit': {
                    console.log(
                        `[StreamEditorSessionProvider][commitMetaEditor] Edit meta selected`,
                    );
                    applyStreamMetadata(data);
                    break;
                }
                default: {
                    throw new Error(
                        `[commitMetaEditor]: commit unexpected metaIntent ${metaIntent.current.action} `,
                    );
                }
            }

            metaIntent.current = { action: 'idle' };
            console.log(`[StreamEditorSessionProvider][commitMetaEditor] metaIntent set to 'idle'`);
            pushMode({ kind: 'edit' });
            console.log(`[StreamEditorSessionProvider][commitMetaEditor] screenMode set to'edit'`);
        },
        [submitCreateStream, applyStreamMetadata, pushMode],
    );

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
                insertAt: pos,
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
                                      insertAt: idx + 1,
                                  }
                                : {
                                      kind: 'streamInsertBlock',
                                      streamId: selectedStreamId,
                                      insertAt: idx,
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
            isJourney,
            isPublished,
            publicStream,
            save,
            onApply,
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
            editMetadata,
            commitMetaEditor,
            publishStream,
            unpublishStream,
            selectThumbnail: jumpToCatalogForThumbnail,
        }),
        [
            selectedStreamId,
            streamsIndex,
            draft,
            isLoading,
            isSaving,
            isValid,
            isDirty,
            isJourney,
            isPublished,
            publicStream,
            save,
            onApply,
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
            editMetadata,
            commitMetaEditor,
            publishStream,
            unpublishStream,
            jumpToCatalogForThumbnail,
        ],
    );
    return <StreamEditorCtx.Provider value={value}>{children}</StreamEditorCtx.Provider>;
}
