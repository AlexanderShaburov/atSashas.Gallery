// src/features/admin/blocks/editorSession/BlockEditorSession.context.tsx

import type {
    Block,
    BlockEditorScreenMode,
    BlockHitEvent,
    BlocksCollectionJSON,
    EditTarget,
    GalleryBlock,
    GalleryBlockItem,
    ItemPosition,
} from '@/entities/block';
import type { UiErrorState } from '@/entities/common';
import {
    addNewBlock,
    getCollection,
    updateBlock,
} from '@/features/admin/blocks/api/blocksApi';
import { getCatalog } from '@/features/admin/catalogEditor/api';
import { refreshStreamsIndex } from '@/features/admin/streams/api/streamsApi';
import { normalizeBlock } from '@/features/admin/blocks/blockEditorSession';
import type {
    BlockEditorSession,
    ScreenModeStack,
} from '@/features/admin/blocks/blockEditorSession/block-editor.types';
import { BlockEditorCtx } from '@/features/admin/blocks/hooks/useBlocksEditor';
import { useBlockDependencyAwareDeletion } from '@/features/admin/blocks/hooks/useBlockDependencyAwareDeletion';
import { validateBlockForm } from '@/features/admin/blocks/utils';
import {
    useArrival,
    useDispatch,
    useJourneyStatus,
    useReturnHome,
} from '@/features/admin/shared/transporter/transporter';
import { deepEqual } from '@/shared/lib/checkers/checkers';
import { EditorKey, JourneyHome, SerializableBlockHitEvent } from '@/shared/nav';
import {
    blocksCollectionStore,
    catalogStore,
    editSessionsDataStore,
    unsavedChangesStore,
    useSessionDataStore,
    useStoreData,
    useUnsavedChanges,
} from '@/shared/state';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
    printoutTicket,
    createEventPickTicket,
    createBackgroundPickTicket,
} from './BlockEditorSession.travel';
import { hitToTarget, instantiateFromTemplate } from './blockEditorSession.utils';
import { resolveBlockBootstrapData } from './bootstrap';
import {
    isBlockReturnCommand,
    validateBlockReturnBootstrapInsertArt,
} from './bootstrap/blockEditorSession.bootstrap.validate';
type ProviderProps = { children: ReactNode };
type SaveResult = { ok: true; id: string } | { ok: false };

export function BlockEditorSessionProvider({ children }: ProviderProps) {
    // Domain stores (data plane)
    const collection = useStoreData(blocksCollectionStore);

    //*******************************************************/
    // Core state:
    const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>(undefined);
    // 5. Editor mode, used to decide if show grid or single block editor:
    const [modeStack, setModeStack] = useState<BlockEditorScreenMode[]>(['select']);
    // 6. Target used to choose if input has to shown on place of text in inlineEditor
    // Editing block element click on that called handler
    const [currentTarget, setCurrentTarget] = useState<EditTarget | undefined>(undefined);
    //*******************************************************/
    // UI / derived state
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [pendingSelection, setPendingSelection] = useState<SerializableBlockHitEvent | undefined>(
        undefined,
    );
    // Errors processing preparation, unimplemented.
    const [uiError, setUiError] = useState<UiErrorState | undefined>(undefined);
    //*******************************************************/

    // React Strict Mode protection for bootstrap
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bootstrapRef = useRef<{ processed: boolean; ticket: any }>({
        processed: false,
        ticket: null,
    });

    // **************** EDITOR DATA EXTRACTION (EXTERNAL STORE) ****************

    // Read saved editor values from the store:
    const key: EditorKey | undefined = selectedBlockId
        ? { kind: 'block', id: selectedBlockId }
        : undefined;
    const sessionData = useSessionDataStore<Block>(key);
    const { storeData, setDraft, commit } = sessionData;
    const draft = storeData?.draft;
    const snapshot = storeData?.snapshot;

    // ************* NAVIGATION HOOKS *************

    // read ticket getter
    const arrival = useArrival();
    const dispatch = useDispatch();
    const returnHome = useReturnHome();

    // NEW: Derived journey state (replaces local useState)
    const isJourney = useJourneyStatus('block');
    //

    // Ref to hold callbacks for deletion hook
    const refreshCallbackRef = useRef<(() => Promise<void>) | null>(null);
    const resetSessionRef = useRef<(() => void) | null>(null);

    // Dependency-aware deletion hook
    const { deleteBlockWithDeps } = useBlockDependencyAwareDeletion({
        onRefresh: async () => {
            if (refreshCallbackRef.current) {
                await refreshCallbackRef.current();
            }
        },
        onComplete: () => {
            if (resetSessionRef.current) {
                resetSessionRef.current();
            }
        },
        isInJourney: isJourney,
    });

    // ************* STATE LOGIC *************

    // ************** LOGICS **************

    const isValid = useMemo(() => (draft ? validateBlockForm(draft) : false), [draft]);

    const isSelected = useMemo(
        () => modeStack[modeStack.length - 1] !== 'select' && !!draft?.id,
        [modeStack, draft],
    );

    const scope: EditorKey | null = useMemo(() => {
        if (!isSelected || !draft) return null;
        return { kind: 'block', id: draft.id };
    }, [isSelected, draft]);

    const dirtyStoreState = useUnsavedChanges(scope ?? { kind: 'block', id: '__none__' });

    const isDirty = useMemo(() => {
        if (!draft) return false;
        return !deepEqual(snapshot, draft);
    }, [draft, snapshot]);

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

    const canSave = useMemo(() => !saving && isDirty && isValid, [saving, isDirty, isValid]);

    // ************** LOGICS END **************

    // ************** STACK CONTROL **************

    const onEscape = useCallback(() => {
        setModeStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    }, []);
    const currentStack: ScreenModeStack = useMemo(() => {
        return {
            screenMode: modeStack[modeStack.length - 1] ?? 'select',
            onEscape: onEscape,
        };
    }, [modeStack, onEscape]);
    // ************** STACK CONTROL END **************

    // ***** Collections preload *****
    const refreshCollection = useCallback(async (): Promise<BlocksCollectionJSON> => {
        console.log(`[refreshCollection]`);
        try {
            setLoading(true);

            // Download and set collections list
            const cl = await getCollection();
            console.log(`[BlockEditorSession.context][refreshCollection] cl:`);
            console.dir(cl);
            blocksCollectionStore.set(cl);

            return cl;
        } catch (e) {
            setUiError({
                title: 'Collection not found',
                message: 'Blocks collection was not loaded. ' + 'Admin app will be reloaded.',
                onConfirm: () => {
                    resetSession();
                },
            });
            throw new Error(`Failed download block collection ${e}`);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Store refreshCollection in ref for deletion hook
    refreshCallbackRef.current = async () => void (await refreshCollection());

    // Inline editable text helper:
    const isEditingTarget = useCallback(
        (t: EditTarget) => {
            if (!currentTarget || !t) return false;

            if (currentTarget.blockKind !== t.blockKind) return false;
            if (currentTarget.kind !== t.kind) return false;

            if ('slot' in currentTarget || 'slot' in t) {
                return 'slot' in currentTarget && 'slot' in t && currentTarget.slot === t.slot;
            }
            return true;
        },
        [currentTarget],
    );

    // Reset session helper
    const resetSession = useCallback(() => {
        console.log(`[resetSession]: Called`);
        setSelectedBlockId(undefined);
        setCurrentTarget(undefined);
        setPendingSelection(undefined);
        setModeStack(['select']);
    }, []);

    // Store resetSession in ref for deletion hook
    resetSessionRef.current = resetSession;

    // *********** MOUNT BOOTSTRAP ***********

    useEffect(() => {
        console.log('[INIT SESSION]: started');

        // React Strict Mode protection: Only process once
        if (bootstrapRef.current.processed) {
            console.log('[INIT SESSION]: Skipping - already processed');
            return;
        }

        // CRITICAL: Call arrival() synchronously FIRST, before any async operations
        // This prevents race conditions in React Strict Mode
        const ticket = arrival('block');
        console.log(`[INIT SESSION]: ticket requested and it is: ${ticket}`);

        // Mark as processed and store ticket
        bootstrapRef.current = { processed: true, ticket };

        let cl: BlocksCollectionJSON | undefined = undefined;
        (async () => {
            try {
                setLoading(true);
                // Refresh collection state
                cl = await refreshCollection();
                if (!cl) return;
            } catch (e) {
                throw new Error(`Error loading blocks collection ${e}`);
            } finally {
                setLoading(false);
            }
            if (!ticket) {
                resetSession();
                return;
            }

            // isJourney now derived from useJourneyStatus() - no manual setting needed
            // Check if this is a return (has loot) or outbound (no loot)
            // Note: tickets always have phase='outbound', the leg state determines if it's returning
            if (!ticket.loot) {
                // OUTBOUND: Someone navigated TO block editor
                console.log(`[INIT SESSION]: outbound ticket found`);
                switch (ticket.destination.mode) {
                    case 'select': {
                        console.log(`[INIT SESSION]: destination mode is SELECT`);
                        resetSession();
                        break;
                    }
                    case 'edit': {
                        console.log(`[INIT SESSION]: destination mode is EDIT`);
                        const id = ticket.destination.objectId;

                        if (!id)
                            throw new Error('Outbound edit ticket missing destination.objectId');
                        setSelectedBlockId(id);
                        const block = cl.blocks[id];
                        if (!block) throw new Error(`Block not found: ${id}`);
                        const key: EditorKey = { kind: 'block', id };
                        editSessionsDataStore.saveDraft(key, block);
                        editSessionsDataStore.setSnapshot(key, block);

                        setModeStack(['select', 'edit']);
                        return;
                    }
                }
            } else {
                // RETURN: Returning from child editor (Catalog) with loot
                console.log(`[INIT SESSION]: RETURN ticket found (has loot)`);
                // 0) Resolve bootstrap dataset (draft+snapshot) saved by the outbound editor
                const tempId = ticket.returnTo.objectId;
                console.log(`[INIT SESSION]: target object detected as ${tempId}`);
                const bootstrapDataSet = await resolveBlockBootstrapData(tempId);
                console.log(`[INIT SESSION]: bootstrap saved data received as:`);
                console.dir(bootstrapDataSet);

                /**
                 * IMPORTANT:
                 * - Bootstrap MUST NOT modify the block.
                 * - Bootstrap MUST restore editor context and execute the return instruction only.
                 */

                // 1) Handle special case: dependency resolution return
                const effect = ticket.returnEffect;
                if (effect?.kind === 'dependencyResolved') {
                    console.log(`[Block BOOTSTRAP]: Dependency resolution return detected`);

                    // User fixed a dependency in stream editor
                    // Refresh all data and re-trigger dependency check for the target block
                    console.log(`[Block BOOTSTRAP]: Refreshing all data sources...`);

                    await Promise.all([
                        refreshCollection(),
                        refreshStreamsIndex(),
                    ]);

                    console.log(`[Block BOOTSTRAP]: All data refreshed`);

                    // Fetch fresh collection and block
                    const targetId = effect.targetId;
                    const freshCollection = await getCollection();
                    const block = freshCollection.blocks?.[targetId];

                    if (block) {
                        console.log(`[Block BOOTSTRAP]: Re-checking dependencies for ${targetId}`);
                        // Re-trigger dependency-aware deletion
                        void deleteBlockWithDeps(block);
                    } else {
                        console.warn(`[Block BOOTSTRAP]: Target block ${targetId} not found after dependency resolution`);
                        setModeStack(['select']);
                    }
                    return;
                }

                // 2) Handle returnEffect kinds separately (insert vs update)
                if (!isBlockReturnCommand(effect)) {
                    throw new Error(
                        `[Bootstrap]: Unexpected returnEffect for BlockEditor: ${effect ? effect.kind : 'undefined'}`,
                    );
                }
                console.log(`[INIT SESSION]: Return effect detected as:`);
                console.dir(effect);

                // 2) Restore selectedBlockId first (required to bind external store scope)
                //    NOTE: blockId always comes from the return effect (both insert/update share blockId)
                const blockId = effect.blockId;
                if (!blockId) throw new Error('[Bootstrap]: returnEffect missing blockId');
                setSelectedBlockId(blockId);

                // ❗️ New approach: just created block hasn't get into collection yet!
                // The true place to get the block - external store!!!
                const key: EditorKey = { kind: 'block', id: blockId };
                console.log(`[INIT SESSION]: Editor Key restored as:`);
                console.dir(key);

                const block = editSessionsDataStore.get<Block>(key);
                if (!block)
                    throw new Error(
                        `[Bootstrap]: Journey ticket block doesn't stored in SessionsDataStore`,
                    );
                console.log(`[INIT SESSION]: saved block read as:`);
                console.dir(block.draft);

                // 4) Execute return instruction
                switch (effect.kind) {
                    case 'blockInsertArt': {
                        // Validate + narrow types (gallery/image/slot matches layout)
                        const v = validateBlockReturnBootstrapInsertArt(ticket, bootstrapDataSet);
                        console.log(
                            `[INIT SESSION]: return instruction recognized as blockInsertArt`,
                        );

                        // Store pendingSelection so later setSelectedArtItem() can apply it
                        setPendingSelection(v.command.pendingSelection);
                        // Create new gallery block item form loot and ticket
                        const newItem: GalleryBlockItem = {
                            kind: 'art',
                            artId: v.loot.id,
                            position: v.command.pendingSelection.hit.slot,
                        };
                        console.log(`[INIT SESSION]: new gallery item created`);
                        console.dir(newItem);
                        // Extract items list form saved and validated data:
                        const items = v.savedData.draft.items;

                        // Make changes in the draft
                        const newDraft = { ...v.savedData.draft, items: [...items, newItem] };
                        console.log(`[INIT SESSION]: new art items list set as:`);
                        console.dir(newDraft.items);

                        // Update changed draft in the store:
                        editSessionsDataStore.saveDraft(key, newDraft);
                        console.log(`[INIT SESSION]: external store data updated:`);

                        // CRITICAL: Refresh catalog to include newly created art item
                        // This ensures the gallery can render the art item that was just created
                        const freshCatalog = await getCatalog();
                        catalogStore.set(freshCatalog);
                        console.log(`[INIT SESSION]: catalog refreshed with new art item`);

                        // Set edited block id
                        setSelectedBlockId(newDraft.id);
                        // Open editor in edit mode
                        setModeStack(['select', 'edit']);
                        console.log(
                            `[INIT SESSION]: screen mode set to edit, and block id is: ${newDraft.id}`,
                        );
                        return;
                    }

                    case 'blockUpdateArt': {
                        // For update-art return we do NOT insert anything here.
                        // We only open the block in edit mode.
                        setPendingSelection(undefined);
                        setModeStack(['select', 'edit']);
                        return;
                    }

                    case 'blockSetEventId': {
                        console.log(`[INIT SESSION]: return instruction recognized as blockSetEventId`);
                        const loot = ticket.loot;
                        if (!loot?.ok) {
                            // User cancelled — remove the empty event placeholder
                            if (block?.draft && block.draft.blockKind === 'gallery') {
                                const { isEventItem } = await import(
                                    '@/shared/lib/checkers/blockItemGuards'
                                );
                                const cleanedItems = block.draft.items.filter(
                                    (item) => !(isEventItem(item) && !item.eventId),
                                );
                                const cleanDraft = { ...block.draft, items: cleanedItems };
                                editSessionsDataStore.saveDraft(key, cleanDraft);
                            }
                            // Show info banner
                            setUiError({
                                title: 'Event insertion cancelled',
                                message: 'The event placeholder was removed.',
                                onConfirm: () => setUiError(undefined),
                            });
                            setModeStack(['select', 'edit']);
                            return;
                        }
                        // Find event item at position and set eventId
                        const pos = (effect as { position: string }).position;
                        if (block?.draft && block.draft.blockKind === 'gallery') {
                            const { isEventItem } = await import('@/shared/lib/checkers/blockItemGuards');
                            const updatedItems = block.draft.items.map((item) =>
                                item.position === pos && isEventItem(item)
                                    ? { ...item, eventId: loot.id }
                                    : item,
                            );
                            const newDraft = { ...block.draft, items: updatedItems };
                            editSessionsDataStore.saveDraft(key, newDraft);
                        }
                        setModeStack(['select', 'edit']);
                        return;
                    }

                    case 'blockSetEventBackground': {
                        console.log(`[INIT SESSION]: return instruction recognized as blockSetEventBackground`);
                        const loot = ticket.loot;
                        if (!loot?.ok) {
                            setModeStack(['select', 'edit']);
                            return;
                        }
                        const pos = (effect as { position: string }).position;
                        if (block?.draft && block.draft.blockKind === 'gallery') {
                            const { isEventItem } = await import('@/shared/lib/checkers/blockItemGuards');
                            const updatedItems = block.draft.items.map((item) =>
                                item.position === pos && isEventItem(item)
                                    ? { ...item, backgroundArtId: loot.id }
                                    : item,
                            );
                            const newDraft = { ...block.draft, items: updatedItems };
                            editSessionsDataStore.saveDraft(key, newDraft);

                            // Refresh catalog to resolve the new background art image
                            const freshCatalog = await getCatalog();
                            catalogStore.set(freshCatalog);
                        }
                        setModeStack(['select', 'edit']);
                        return;
                    }

                    default: {
                        // Should be unreachable due to isBlockReturnCommand, but keep as safety net
                        throw new Error(`[Bootstrap]: Unsupported returnEffect kind`);
                    }
                }
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // *********** MOUNT BOOTSTRAP END ***********

    // ************ UI handlers *************

    // -------- SAVE procedure ----------

    const save = useCallback(async (): Promise<SaveResult> => {
        console.log(`[save]: called and curren draft is:`);
        console.dir(draft);
        console.log(`[save]: canSave is ${canSave}:`);
        if (!draft) return { ok: false };
        let saved: Block | null = null;

        setSaving(true);
        try {
            if (saved) {
                console.log(`[save]: called and curren draft is:`);
                console.dir(draft);
            }
            switch (draft?.lifecycle) {
                case 'template': {
                    throw new Error(`Attempt to save template as block`);
                    break;
                }
                case 'draft': {
                    saved = await addNewBlock(draft);
                    editSessionsDataStore.clear({ kind: 'block', id: draft.id });
                    setSelectedBlockId(saved.id);
                    stackNewDraft(saved);
                    break;
                }
                case 'saved': {
                    await updateBlock(draft);
                    break;
                }
                default:
                    console.error(
                        `Unexpected draft.lifecycle or undefined draft while saving ${draft.lifecycle}`,
                    );
            }
            commit();
        } catch (err) {
            console.error(`Failed to save block: ${err}`);
            return { ok: false };
        } finally {
            await refreshCollection();
            setSaving(false);
        }
        if (saved) console.log(`[save]: block saved and new id received: ${saved.id}`);
        if (!saved) console.log(`[save]: block saved and id stay: ${draft.id}`);
        return { ok: true, id: saved ? saved.id : draft.id };
    }, [draft, canSave, refreshCollection, commit]);

    // ******** After save processing ********

    const finalizeAfterSave = useCallback(
        (savedId: string) => {
            console.log(`[finalizeAfterSave]: called`);
            // If in a journey, return home with the saved block ID
            if (isJourney) {
                console.log(
                    `[finalizeAfterSave]: in journey, returning home with blockId: ${savedId}`,
                );
                returnHome('block', { ok: true, id: savedId });
            }
            resetSession();
        },
        [isJourney, returnHome, resetSession],
    );
    // *********** TOOLBAR HANDLERS ***********

    // ----------- APPLY ------------
    // apply button handler
    const onApply = useCallback(() => {
        void (async () => {
            if (!isJourney) return;
            const r = await save();
            if (r.ok) finalizeAfterSave(r.id);
        })();
    }, [finalizeAfterSave, isJourney, save]);

    // ----------- SAVE ----------
    // save button handler
    const onSaveClick = useCallback(() => {
        void (async () => {
            const r = await save();
            if (r.ok) finalizeAfterSave(r.id);
        })();
    }, [save, finalizeAfterSave]);

    // ---------- EXIT ---------
    // exit button handler
    const exit = useCallback(() => {
        if (saving) return;
        if (isDirty && !confirm('Discard unsaved block changes?')) return;
        if (isJourney) {
            returnHome('block', { ok: false, reason: 'cancel' });
        }
        resetSession();
    }, [saving, isDirty, isJourney, returnHome, resetSession]);

    // ----------- DELETE -----------
    // delete button handler
    const onDelete = useCallback(() => {
        console.log(`onDelete called for block ${draft?.id}`);
        if (!draft || !draft.id || draft.lifecycle !== 'saved') return;

        // Use dependency-aware deletion
        void deleteBlockWithDeps(draft);
    }, [draft, deleteBlockWithDeps]);

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

    // ----------- EDIT handlers -----------
    // edit mode onBlock click handler
    const handleEditHit = useCallback(
        (hit: BlockHitEvent) => {
            console.log(`[handleEditHit]: edit mode hit detected`);
            console.dir(hit);
            if (currentStack.screenMode !== 'edit') return;
            const tg = hitToTarget(hit);
            if (tg.blockKind === 'gallery' && tg.kind == 'image') {
                const ticket = printoutTicket(hit);
                if (!ticket) return;

                // NEW: Provide home when starting journey to Catalog
                const home: JourneyHome = {
                    editor: 'block',
                    objectId: draft?.id,
                };
                dispatch(ticket, home);
            } else if (tg.blockKind === 'gallery' && tg.kind === 'eventPickEvent' && tg.slot) {
                if (!draft?.id) return;
                const ticket = createEventPickTicket(draft.id, tg.slot);
                const home: JourneyHome = { editor: 'block', objectId: draft.id };
                dispatch(ticket, home);
            } else if (tg.blockKind === 'gallery' && tg.kind === 'eventPickBackground' && tg.slot) {
                if (!draft?.id) return;
                const ticket = createBackgroundPickTicket(draft.id, tg.slot);
                const home: JourneyHome = { editor: 'block', objectId: draft.id };
                dispatch(ticket, home);
            } else {
                setCurrentTarget(tg);
                console.log(`[handleEditHit]: currentTarget set to th:`);
                console.dir(tg);
            }
        },
        [currentStack.screenMode, dispatch, draft?.id],
    );
    // Direct stack save for new block until hooks are unavailable
    const stackNewDraft = (b: Block): void => {
        const key: EditorKey = { kind: 'block', id: b.id };
        editSessionsDataStore.saveDraft<Block>(key, b);
        editSessionsDataStore.commit<Block>(key);
    };
    // select mode onBlock click handler
    const handleSelectHit = useCallback((hit: BlockHitEvent) => {
        console.log(`[BlockEditorSessionProvider][handleSelectHit]: Called`);
        switch (hit.block.lifecycle) {
            case 'draft': {
                console.log(`[BlockEditorSessionProvider][handleSelectHit]: Called`);
                console.warn(
                    `[handleSelectHit]: Block ${hit.block.id} has inappropriate lifecycle type 'draft'!`,
                );
                break;
            }
            case 'saved': {
                console.log(
                    `[BlockEditorSessionProvider][handleSelectHit]: Saved lifecycle detected`,
                );
                setSelectedBlockId(hit.block.id);
                const v = normalizeBlock(hit.block);
                stackNewDraft(v);
                console.log(`[BlockEditorSessionProvider][handleSelectHit]: commit called`);
                break;
            }
            case 'template': {
                console.log(
                    `[BlockEditorSessionProvider][handleSelectHit]: template branch selected`,
                );
                const draft = instantiateFromTemplate(hit.block);
                const v = normalizeBlock(draft);
                setSelectedBlockId(v.id);
                v.lifecycle = 'draft';
                stackNewDraft(v);
                break;
            }
        }
        setModeStack(['select', 'edit']);
    }, []);

    // common click handler
    const onHit = useCallback(
        (hit: BlockHitEvent) => {
            if (currentStack.screenMode === 'select') handleSelectHit(hit);
            else handleEditHit(hit);
        },
        [currentStack.screenMode, handleEditHit, handleSelectHit],
    );

    // hit handler helper
    const unHit = useCallback(() => {
        console.log('[unHit]: Called.');
        setCurrentTarget(undefined);
    }, []);

    /** Add event placeholder at a gallery slot and dispatch journey to event editor */
    const addEventAndJourney = useCallback(
        (pos: ItemPosition) => {
            if (!draft || draft.blockKind !== 'gallery') return;

            // Guard: one event per block
            const galleryDraft = draft as GalleryBlock;
            const hasEvent = galleryDraft.items.some((i) => i.kind === 'eventCta');
            if (hasEvent) return;

            // 1) Create event placeholder; if an art item occupies the target slot,
            //    convert its artId into the event's backgroundArtId and replace it.
            const existing = galleryDraft.items.find((i) => i.position === pos);
            const backgroundArtId =
                existing && existing.kind === 'art' ? existing.artId : undefined;

            const newEventItem: GalleryBlockItem = {
                kind: 'eventCta',
                eventId: '',
                position: pos,
                ...(backgroundArtId ? { backgroundArtId } : {}),
            };

            // Replace the existing item at this position (if any), then append the event
            const filteredItems = galleryDraft.items.filter((i) => i.position !== pos);
            const newDraft = { ...draft, items: [...filteredItems, newEventItem] };

            // 2) Save draft to external store (survives navigation).
            // NOTE: setDraft() is intentionally skipped — dispatch() navigates away,
            // so React state update is unnecessary. Draft restores from store on return.
            const key: EditorKey = { kind: 'block', id: draft.id };
            editSessionsDataStore.saveDraft(key, newDraft);

            // 3) Dispatch journey ticket to event editor
            const ticket = createEventPickTicket(draft.id, pos);
            const home: JourneyHome = { editor: 'block', objectId: draft.id };
            dispatch(ticket, home);
        },
        [draft, dispatch],
    );

    /** Update a gallery item caption at a given position */
    const updateItemCaption = useCallback(
        (pos: ItemPosition, caption: string) => {
            if (!draft || draft.blockKind !== 'gallery') return;
            const newItems = (draft as GalleryBlock).items.map((i) =>
                i.position === pos
                    ? { ...i, caption: { ...('caption' in i ? i.caption ?? {} : {}), en: caption } }
                    : i,
            );
            setDraft({ ...draft, items: newItems });
        },
        [draft, setDraft],
    );

    /** Update the block-level caption */
    const updateBlockCaption = useCallback(
        (caption: string) => {
            if (!draft || draft.blockKind !== 'gallery') return;
            setDraft({
                ...draft,
                caption: { ...(draft.caption ?? {}), en: caption },
            } as GalleryBlock);
        },
        [draft, setDraft],
    );

    const value: BlockEditorSession = useMemo(
        () => ({
            draft,
            collection,
            setDraft,
            currentStack,
            isDirty,
            isValid,
            canSave,
            loading,
            saving,
            uiError,
            isJourney,
            onSaveClick,
            exit,
            onHit,
            unHit,
            onDelete,
            updateTags,
            isEditingTarget,
            onApply,
            addEventAndJourney,
            updateItemCaption,
            updateBlockCaption,
        }),
        [
            draft,
            collection,
            isDirty,
            isValid,
            canSave,
            loading,
            saving,
            uiError,
            isJourney,
            currentStack,
            onSaveClick,
            exit,
            onHit,
            unHit,
            onDelete,
            updateTags,
            isEditingTarget,
            onApply,
            setDraft,
            addEventAndJourney,
            updateItemCaption,
            updateBlockCaption,
        ],
    );

    return <BlockEditorCtx.Provider value={value}>{children}</BlockEditorCtx.Provider>;
}
