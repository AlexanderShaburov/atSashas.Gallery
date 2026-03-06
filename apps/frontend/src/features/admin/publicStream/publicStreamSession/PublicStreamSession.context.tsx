// features/admin/publicStream/publicStreamSession/PublicStreamSession.context.tsx

import type { Block } from '@/entities/block';
import type { HomeDoc, HomeItem } from '@/entities/homeDoc';
import type { JourneyTicket, ReturnCommand } from '@/shared/nav';
import type { JourneyHome } from '@/shared/nav/journeySession.types';
import type { ReturnAddress, ToAddress } from '@/shared/nav/journey.types';
import type { EditorKey } from '@/shared/nav';
import { useArrival, useDispatch } from '@/features/admin/shared/transporter/transporter';
import { useGuardedNavigate } from '@/features/admin/shared/hooks/useGuardedNavigate';
import { generateId } from '@/shared/lib/id/generateId';
import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { deepEqual } from '@/shared/lib/checkers/checkers';
import {
    blocksCollectionStore,
    editSessionsDataStore,
    streamsIndexStore,
    unsavedChangesStore,
    useSessionDataStore,
    useStoreData,
    useUnsavedChanges,
} from '@/shared/state';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { homeDocAdminApi } from '../api/homeDocAdminApi';
import type { PublicStreamSession } from './publicStreamSession.types';

const PublicStreamSessionContext = createContext<PublicStreamSession | undefined>(undefined);

const HOME_KEY: EditorKey = { kind: 'home', id: 'home-doc' };

// eslint-disable-next-line react-refresh/only-export-components
export function usePublicStreamSession(): PublicStreamSession {
    const ctx = useContext(PublicStreamSessionContext);
    if (!ctx) {
        throw new Error('usePublicStreamSession must be used within PublicStreamSessionProvider');
    }
    return ctx;
}

type Props = {
    children: React.ReactNode;
};

export function PublicStreamSessionProvider({ children }: Props) {
    const streamsIndex = useStoreData(streamsIndexStore);
    const blocksCollection = useStoreData(blocksCollectionStore);

    const guardedNavigate = useGuardedNavigate();
    const dispatch = useDispatch();
    const arrival = useArrival();

    // External store binding (draft/snapshot)
    const { storeData, setDraft, commit } = useSessionDataStore<HomeDoc>(HOME_KEY);
    const draft = storeData?.draft ?? null;
    const snapshot = storeData?.snapshot ?? null;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const bootstrapRef = useRef<{ processed: boolean; ticket?: JourneyTicket }>({
        processed: false,
    });

    // Bootstrap: Load HomeDoc + handle journey return
    useEffect(() => {
        if (bootstrapRef.current.processed) {
            console.log('[HomeComposer]: Skipping bootstrap - already processed');
            return;
        }

        // CRITICAL: Call arrival() synchronously FIRST
        const ticket = arrival('home');
        console.log('[HomeComposer]: arrival ticket:', ticket);
        bootstrapRef.current = { processed: true, ticket };

        void (async () => {
            try {
                setIsLoading(true);
                const data = await homeDocAdminApi.get();
                console.log('[HomeComposer]: HomeDoc loaded:', data);

                // If returning from block editor with loot, insert the block
                if (ticket?.loot?.ok && ticket.returnEffect?.kind === 'homeInsertBlock') {
                    const blockId = ticket.loot.id;
                    console.log('[HomeComposer]: Journey return - inserting block:', blockId);

                    const alreadyExists = data.items.some(
                        (it) => it.kind === 'blockRef' && it.blockId === blockId,
                    );

                    if (!alreadyExists) {
                        const newItem: HomeItem = { kind: 'blockRef', blockId };
                        const newDoc = { ...data, items: [...data.items, newItem] };
                        // setSnapshot FIRST (it sets both snapshot=data AND draft=data),
                        // then saveDraft overwrites only draft with newDoc (preserving snapshot)
                        editSessionsDataStore.setSnapshot(HOME_KEY, data);
                        editSessionsDataStore.saveDraft(HOME_KEY, newDoc);
                    } else {
                        editSessionsDataStore.saveDraft(HOME_KEY, data);
                        editSessionsDataStore.commit(HOME_KEY);
                    }
                } else {
                    editSessionsDataStore.saveDraft(HOME_KEY, data);
                    editSessionsDataStore.commit(HOME_KEY);
                }
            } catch (err) {
                console.error('[HomeComposer]: Failed to load HomeDoc', err);
                alert(`Failed to load HomeDoc: ${err}`);
            } finally {
                setIsLoading(false);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calculate isDirty via deepEqual
    const isDirty = useMemo(() => {
        if (!draft || !snapshot) return false;
        return !deepEqual(snapshot, draft);
    }, [draft, snapshot]);

    // Sync isDirty with unsavedChangesStore
    const dirtyStoreState = useUnsavedChanges(HOME_KEY);
    useEffect(() => {
        if (isDirty !== dirtyStoreState) {
            unsavedChangesStore.setDirty(HOME_KEY, isDirty);
        }
    }, [isDirty, dirtyStoreState]);

    // Cleanup unsavedChangesStore on unmount
    useEffect(() => {
        return () => unsavedChangesStore.clear(HOME_KEY);
    }, []);

    // Available streams (status: ready or published)
    const availableStreams = (streamsIndex || []).filter(
        (s) => s.status === 'ready' || s.status === 'published',
    );

    // Available blocks from collection
    const availableBlocks: Block[] = useMemo(() => {
        if (!blocksCollection) return [];
        return blocksCollection.order
            .map((id) => blocksCollection.blocks[id])
            .filter((b): b is Block => b !== undefined);
    }, [blocksCollection]);

    /** Add stream ref to draft */
    const addStream = useCallback((streamSlug: string) => {
        const current = editSessionsDataStore.get<HomeDoc>(HOME_KEY)?.draft;
        if (!current) return;
        const alreadyExists = current.items.some(
            (it) => it.kind === 'streamRef' && it.streamSlug === streamSlug,
        );
        if (alreadyExists) return;
        const newItem: HomeItem = { kind: 'streamRef', streamSlug };
        editSessionsDataStore.saveDraft(HOME_KEY, { ...current, items: [...current.items, newItem] });
    }, []);

    /** Navigate to Block editor via Journey to select/create a block */
    const addBlockViaJourney = useCallback(() => {
        const returnTo: ReturnAddress = {
            editor: 'home',
            mode: 'edit',
            objectId: 'home-doc',
        };

        const command: ReturnCommand = {
            kind: 'homeInsertBlock',
        };

        const to: ToAddress = {
            editor: 'block',
            mode: 'select',
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

        const home: JourneyHome = {
            editor: 'home',
            objectId: 'home-doc',
        };

        dispatch(ticket, home);
    }, [dispatch]);

    /** Remove item at index */
    const removeItem = useCallback((index: number) => {
        const current = editSessionsDataStore.get<HomeDoc>(HOME_KEY)?.draft;
        if (!current) return;
        setDraft({ ...current, items: current.items.filter((_, i) => i !== index) });
    }, [setDraft]);

    /** Reorder items */
    const reorderItems = useCallback((items: HomeItem[]) => {
        const current = editSessionsDataStore.get<HomeDoc>(HOME_KEY)?.draft;
        if (!current) return;
        setDraft({ ...current, items: [...items] });
    }, [setDraft]);

    /** Set item size at index */
    const setItemSize = useCallback((index: number, size: 'S' | 'M' | 'L') => {
        const current = editSessionsDataStore.get<HomeDoc>(HOME_KEY)?.draft;
        if (!current) return;
        const newItems = current.items.map((item, i) =>
            i === index ? { ...item, size } : item,
        );
        setDraft({ ...current, items: newItems });
    }, [setDraft]);

    /** Save all draft changes */
    const save = useCallback(async () => {
        if (!draft) return;
        if (!confirm('Apply changes to the public site?')) return;

        try {
            setIsSaving(true);
            const saved = await homeDocAdminApi.update(draft);
            editSessionsDataStore.saveDraft(HOME_KEY, saved);
            commit();
            console.log('[HomeComposer]: Saved successfully');
        } catch (err) {
            console.error('[HomeComposer]: Save failed', err);
            alert(`Failed to save: ${err}`);
        } finally {
            setIsSaving(false);
        }
    }, [draft, commit]);

    /** Discard changes */
    const discard = useCallback(() => {
        if (snapshot) {
            setDraft(snapshot);
        }
    }, [snapshot, setDraft]);

    /** Preview HomeDoc in a new tab */
    const preview = useCallback(() => {
        if (draft) {
            localStorage.setItem('__preview_home_doc', JSON.stringify(draft));
        }
        window.open('/preview', '_blank', 'noopener,noreferrer');
    }, [draft]);

    /** Streams not yet added to HomeDoc */
    const nonPublicStreams = useMemo(() => {
        const items = draft?.items ?? [];
        const usedStreamSlugs = new Set(
            items
                .filter((it): it is Extract<HomeItem, { kind: 'streamRef' }> => it.kind === 'streamRef')
                .map((it) => it.streamSlug),
        );
        return availableStreams.filter((s) => !usedStreamSlugs.has(s.streamId));
    }, [draft, availableStreams]);

    /** Navigate to stream editor via Journey */
    const editStreamViaJourney = useCallback(
        (streamId: string) => {
            const returnTo: ReturnAddress = {
                editor: 'home',
                mode: 'edit',
                objectId: 'home-doc',
            };

            const to: ToAddress = {
                editor: 'stream',
                mode: 'edit',
                objectId: streamId,
            };

            const ticket: JourneyTicket = {
                journeyId: generateId('travel'),
                destination: to,
                returnTo,
                phase: 'outbound',
                nonce: createNonce(),
                createdAt: nowIso(),
                returnEffect: undefined,
            };

            const home: JourneyHome = {
                editor: 'home',
                objectId: 'home-doc',
            };

            dispatch(ticket, home);
        },
        [dispatch],
    );

    /** Exit editor */
    const exit = useCallback(() => {
        guardedNavigate('/admin');
    }, [guardedNavigate]);

    const session: PublicStreamSession = {
        homeDoc: draft,
        availableStreams,
        availableBlocks,
        isLoading,
        isSaving,
        isDirty,
        addStream,
        addBlockViaJourney,
        removeItem,
        reorderItems,
        setItemSize,
        save,
        discard,
        preview,
        nonPublicStreams,
        editStreamViaJourney,
        exit,
    };

    return (
        <PublicStreamSessionContext.Provider value={session}>
            {children}
        </PublicStreamSessionContext.Provider>
    );
}
