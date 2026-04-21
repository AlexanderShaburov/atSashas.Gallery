// features/admin/homeEditor/homeEditorSession/HomeEditorSession.context.tsx
//
// Homepage Editor control plane. Logic-only; draft/snapshot live in
// editSessionsDataStore under editor key { kind:'home', id:'home-doc' }.
//
// Bootstrap:
//   - arrival('home') is called synchronously first (strict-mode safe).
//   - HomeDoc is loaded from /api/admin/home.
//   - If returning from a journey with loot, the return effect decides:
//     * homeInsertStream → append streamRef (dedupe by streamId).
//     * homeInsertEvent  → append eventRef  (dedupe by eventPageId).
//   - Otherwise, editor opens fresh in edit mode.

import { refreshEventPages } from '@/features/admin/eventPageEditor/api/eventPagesAdminApi';
import { useGuardedNavigate } from '@/features/admin/shared/hooks/useGuardedNavigate';
import { useArrival, useDispatch, useJourneyStatus } from '@/features/admin/shared/transporter/transporter';
import type { HomeDoc, HomeItem } from '@/entities/homeDoc';
import { homeDocAdminApi } from '@/features/admin/homeEditor/api/homeDocAdminApi';
import { deepEqual } from '@/shared/lib/checkers/checkers';
import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { generateId } from '@/shared/lib/id/generateId';
import type { EditorKey, JourneyTicket, ReturnCommand } from '@/shared/nav';
import type { ReturnAddress, ToAddress } from '@/shared/nav/journey.types';
import type { JourneyHome } from '@/shared/nav/journeySession.types';
import { editSessionsDataStore, streamsIndexStore, unsavedChangesStore, useSessionDataStore, useUnsavedChanges } from '@/shared/state';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { HomeEditorSession } from './homeEditorSession.types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const HomeEditorSessionContext = createContext<HomeEditorSession | undefined>(undefined);

const HOME_KEY: EditorKey = { kind: 'home', id: 'home-doc' };
const HOME_ID = 'home-doc' as const;

// localStorage key for persisting an in-flight draft across page reloads.
// editSessionsDataStore is in-memory only, so without this a hard refresh
// erases unsaved composition work. Key is unique to HomeDoc — scoping to
// other editors is intentionally not done here.
const HOME_DRAFT_STORAGE_KEY = '__home_doc_draft';

// eslint-disable-next-line react-refresh/only-export-components
export function useHomeEditorSession(): HomeEditorSession {
    const ctx = useContext(HomeEditorSessionContext);
    if (!ctx) {
        throw new Error('useHomeEditorSession must be used within HomeEditorSessionProvider');
    }
    return ctx;
}

type ProviderProps = { children: React.ReactNode };

export function HomeEditorSessionProvider({ children }: ProviderProps) {
    const arrival = useArrival();
    const dispatch = useDispatch();
    const guardedNavigate = useGuardedNavigate();
    const isJourney = useJourneyStatus('home');

    // Draft/snapshot via editor data store (external).
    const { storeData, setDraft, commit } = useSessionDataStore<HomeDoc>(HOME_KEY);
    const draft = storeData?.draft ?? null;
    const snapshot = storeData?.snapshot ?? null;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Strict-mode bootstrap guard: run the mount effect exactly once.
    const bootstrappedRef = useRef(false);

    // ────────────────────────────────────────────────────────────────
    // Bootstrap
    // ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (bootstrappedRef.current) {
            console.log('[HomeEditor]: bootstrap already processed');
            return;
        }
        bootstrappedRef.current = true;

        // Synchronous arrival first — per Journey bootstrap invariant.
        const ticket = arrival('home');
        console.log('[HomeEditor]: arrival ticket:', ticket);

        void (async () => {
            try {
                setIsLoading(true);

                // Always refresh source stores on mount — HomeEditor never trusts
                // previously primed state, per decision D. Cheap admin GETs;
                // guarantees orphan/updated tiles render against current data.
                await refreshEventPages();
                try {
                    const res = await fetch(`${API_BASE}/admin/streams`);
                    if (res.ok) {
                        streamsIndexStore.set(await res.json());
                    }
                } catch (e) {
                    console.warn('[HomeEditor]: streams index load failed (non-fatal):', e);
                }

                const doc = await homeDocAdminApi.get();

                // CRITICAL ORDER: read the in-memory draft BEFORE calling
                // setSnapshot — setSnapshot clobbers draft=snapshot as a side
                // effect (see editorSessionsData.store.ts), so reading after
                // would always yield `doc` and silently erase pending work.
                const inMemoryDraft =
                    editSessionsDataStore.get<HomeDoc>(HOME_KEY)?.draft ?? undefined;

                // If no in-memory draft (e.g. hard page reload), try to restore
                // a persisted draft from localStorage. This survives reloads.
                let recoveredDraft: HomeDoc | undefined = inMemoryDraft;
                if (!recoveredDraft) {
                    try {
                        const raw = localStorage.getItem(HOME_DRAFT_STORAGE_KEY);
                        if (raw) {
                            recoveredDraft = JSON.parse(raw) as HomeDoc;
                            console.log(
                                '[HomeEditor]: restored draft from localStorage',
                            );
                        }
                    } catch (e) {
                        console.warn(
                            '[HomeEditor]: failed to parse persisted draft; ignoring:',
                            e,
                        );
                        try {
                            localStorage.removeItem(HOME_DRAFT_STORAGE_KEY);
                        } catch {
                            /* noop */
                        }
                    }
                }

                // Snapshot always reflects the latest persisted state. Dirty is
                // then computed as draft ≠ snapshot. This also wipes draft to
                // doc as a side effect — fine, we restore the real draft below.
                editSessionsDataStore.setSnapshot<HomeDoc>(HOME_KEY, doc);

                // Preserve any in-flight draft across route transitions and page
                // reloads. The base for dedup / effect application is:
                //   - existing in-memory draft, if any
                //   - otherwise, a localStorage-persisted draft, if any
                //   - otherwise, the freshly-fetched server doc
                const base: HomeDoc = recoveredDraft ?? doc;

                const loot = ticket?.loot;
                const effect = ticket?.returnEffect;

                let nextDraft: HomeDoc = base;

                if (loot?.ok && effect) {
                    if (effect.kind === 'homeInsertStream') {
                        const streamId = loot.id;
                        // Dedup against the CURRENT base (draft-or-server). This
                        // prevents duplicate insertion if bootstrap runs more than
                        // once for the same journey return.
                        const alreadyExists = base.items.some(
                            (it) => it.kind === 'streamRef' && it.streamId === streamId,
                        );
                        if (!alreadyExists) {
                            const newItem: HomeItem = { kind: 'streamRef', streamId };
                            nextDraft = { ...base, items: [...base.items, newItem] };
                        }
                    } else if (effect.kind === 'homeInsertEvent') {
                        const eventPageId = loot.id;
                        const alreadyExists = base.items.some(
                            (it) => it.kind === 'eventRef' && it.eventPageId === eventPageId,
                        );
                        if (!alreadyExists) {
                            const newItem: HomeItem = { kind: 'eventRef', eventPageId };
                            nextDraft = { ...base, items: [...base.items, newItem] };
                        }
                    }
                    // Unrecognized / non-applicable effects: base unchanged.
                }

                editSessionsDataStore.saveDraft<HomeDoc>(HOME_KEY, nextDraft);
            } catch (err) {
                console.error('[HomeEditor]: bootstrap failed', err);
                alert(`Failed to load Homepage: ${err}`);
            } finally {
                setIsLoading(false);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ────────────────────────────────────────────────────────────────
    // Dirty tracking
    // ────────────────────────────────────────────────────────────────
    const isDirty = useMemo(() => {
        if (!draft || !snapshot) return false;
        return !deepEqual(snapshot, draft);
    }, [draft, snapshot]);

    const dirtyStoreState = useUnsavedChanges(HOME_KEY);
    useEffect(() => {
        if (isDirty !== dirtyStoreState) {
            unsavedChangesStore.setDirty(HOME_KEY, isDirty);
        }
    }, [isDirty, dirtyStoreState]);

    useEffect(() => {
        return () => unsavedChangesStore.clear(HOME_KEY);
    }, []);

    // Mirror dirty draft to localStorage so it survives a hard page reload.
    //
    // IMPORTANT: subscribe directly to editSessionsDataStore (not a React
    // useEffect([draft, isDirty])). The React-state path can fire during the
    // transient setSnapshot(doc) → saveDraft(nextDraft) window where
    // isDirty is briefly false, which would remove the key mid-bootstrap.
    // The subscription is a pure write-on-dirty observer — never auto-
    // removes. Explicit cleanup lives in save() and discard().
    useEffect(() => {
        const sync = () => {
            const data = editSessionsDataStore.get<HomeDoc>(HOME_KEY);
            if (!data) return;
            const dirty = !deepEqual(data.snapshot, data.draft);
            if (!dirty) return; // never auto-remove; see save/discard
            try {
                localStorage.setItem(
                    HOME_DRAFT_STORAGE_KEY,
                    JSON.stringify(data.draft),
                );
            } catch (e) {
                console.warn('[HomeEditor]: failed to persist draft:', e);
            }
        };
        return editSessionsDataStore.subscribe(sync);
    }, []);

    // ────────────────────────────────────────────────────────────────
    // Journey dispatchers
    // ────────────────────────────────────────────────────────────────
    const dispatchJourney = useCallback(
        (to: ToAddress, effect: ReturnCommand | undefined) => {
            const returnTo: ReturnAddress = { editor: 'home', mode: 'edit', objectId: HOME_ID };
            const ticket: JourneyTicket = {
                journeyId: generateId('travel'),
                destination: to,
                returnTo,
                phase: 'outbound',
                nonce: createNonce(),
                createdAt: nowIso(),
                returnEffect: effect,
            };
            const home: JourneyHome = { editor: 'home', objectId: HOME_ID };
            dispatch(ticket, home);
        },
        [dispatch],
    );

    const addStreamViaJourney = useCallback(() => {
        dispatchJourney(
            { editor: 'stream', mode: 'select' },
            { kind: 'homeInsertStream' },
        );
    }, [dispatchJourney]);

    const addEventViaJourney = useCallback(() => {
        dispatchJourney(
            { editor: 'eventPages', mode: 'select' },
            { kind: 'homeInsertEvent' },
        );
    }, [dispatchJourney]);

    const openStreamItem = useCallback(
        (index: number) => {
            const current = editSessionsDataStore.get<HomeDoc>(HOME_KEY)?.draft;
            const item = current?.items[index];
            if (!item || item.kind !== 'streamRef') return;
            dispatchJourney(
                { editor: 'stream', mode: 'edit', objectId: item.streamId },
                undefined,
            );
        },
        [dispatchJourney],
    );

    const openEventItem = useCallback(
        (index: number) => {
            const current = editSessionsDataStore.get<HomeDoc>(HOME_KEY)?.draft;
            const item = current?.items[index];
            if (!item || item.kind !== 'eventRef') return;
            dispatchJourney(
                { editor: 'eventPages', mode: 'edit', objectId: item.eventPageId },
                undefined,
            );
        },
        [dispatchJourney],
    );

    // ────────────────────────────────────────────────────────────────
    // Local mutations
    // ────────────────────────────────────────────────────────────────
    const removeItem = useCallback(
        (index: number) => {
            const current = editSessionsDataStore.get<HomeDoc>(HOME_KEY)?.draft;
            if (!current) return;
            setDraft({ ...current, items: current.items.filter((_, i) => i !== index) });
        },
        [setDraft],
    );

    const reorderItems = useCallback(
        (items: HomeItem[]) => {
            const current = editSessionsDataStore.get<HomeDoc>(HOME_KEY)?.draft;
            if (!current) return;
            setDraft({ ...current, items: [...items] });
        },
        [setDraft],
    );

    // ────────────────────────────────────────────────────────────────
    // Lifecycle
    // ────────────────────────────────────────────────────────────────
    const save = useCallback(async () => {
        if (!draft) return;
        try {
            setIsSaving(true);
            const saved = await homeDocAdminApi.update(draft);
            editSessionsDataStore.saveDraft<HomeDoc>(HOME_KEY, saved);
            commit();
            // Clean state — drop any persisted draft so a future reload
            // starts from the saved server state, not a stale snapshot.
            try {
                localStorage.removeItem(HOME_DRAFT_STORAGE_KEY);
            } catch {
                /* noop */
            }
            console.log('[HomeEditor]: saved');
        } catch (err) {
            console.error('[HomeEditor]: save failed', err);
            alert(`Failed to save Homepage: ${err}`);
        } finally {
            setIsSaving(false);
        }
    }, [draft, commit]);

    const discard = useCallback(() => {
        if (snapshot) setDraft(snapshot);
        try {
            localStorage.removeItem(HOME_DRAFT_STORAGE_KEY);
        } catch {
            /* noop */
        }
    }, [snapshot, setDraft]);

    const preview = useCallback(() => {
        // Strict ordering: write draft to localStorage FIRST, then open the preview
        // tab. window.open is synchronous so the new tab always observes the write.
        if (draft) {
            const payload = JSON.stringify(draft);
            localStorage.setItem('__preview_home_doc', payload);
            console.log(
                `[HomeEditor][preview] wrote draft with ${draft.items.length} item(s) to localStorage`,
            );
        } else {
            console.warn(
                '[HomeEditor][preview] draft is null; preview will fall back to public state',
            );
        }
        // Note: window.open with 'noopener,noreferrer' returns null by design in
        // many browsers (security), so we can't use its return value to detect a
        // popup block. Intentionally no alert here.
        window.open('/preview', '_blank', 'noopener,noreferrer');
    }, [draft]);

    const exit = useCallback(() => {
        guardedNavigate('/admin');
    }, [guardedNavigate]);

    const session: HomeEditorSession = useMemo(
        () => ({
            homeDoc: draft,
            isLoading,
            isSaving,
            isDirty,
            isJourney,
            addStreamViaJourney,
            addEventViaJourney,
            openStreamItem,
            openEventItem,
            removeItem,
            reorderItems,
            save,
            discard,
            preview,
            exit,
        }),
        [
            draft,
            isLoading,
            isSaving,
            isDirty,
            isJourney,
            addStreamViaJourney,
            addEventViaJourney,
            openStreamItem,
            openEventItem,
            removeItem,
            reorderItems,
            save,
            discard,
            preview,
            exit,
        ],
    );

    return (
        <HomeEditorSessionContext.Provider value={session}>
            {children}
        </HomeEditorSessionContext.Provider>
    );
}
