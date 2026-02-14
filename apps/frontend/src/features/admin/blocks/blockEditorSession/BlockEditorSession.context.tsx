// src/features/admin/blocks/editorSession/BlockEditorSession.context.tsx

import type {
    Block,
    BlockEditorScreenMode,
    BlocksCollectionJSON,
    EditTarget,
    GalleryBlockItem,
} from '@/entities/block';
import type { UiErrorState } from '@/entities/common';
import {
    addNewBlock,
    deleteBlock,
    getCollection,
    updateBlock,
} from '@/features/admin/blocks/api/blocksApi';
import { getCatalog } from '@/features/admin/catalogEditor/api';
import { normalizeBlock } from '@/features/admin/blocks/blockEditorSession';
import type {
    BlockEditorSession,
    ScreenModeStack,
} from '@/features/admin/blocks/blockEditorSession/block-editor.types';
import { BlockEditorCtx } from '@/features/admin/blocks/hooks/useBlocksEditor';
import { useBlockDependencyAwareDeletion } from '@/features/admin/blocks/hooks/useBlockDependencyAwareDeletion';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
import { validateBlockForm } from '@/features/admin/blocks/utils';
import type { EditorWorkspaceContextValue } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import {
    useArrival,
    useDispatch,
    useJourneyStatus,
    useReturnHome,
} from '@/features/admin/shared/transporter/transporter';
import { deepEqual } from '@/shared/lib/checkers/checkers';
import { EditorKey, JourneyHome, SerializableBlockHitEvent } from '@/shared/nav';
import {
    editSessionsDataStore,
    unsavedChangesStore,
    useSessionDataStore,
    useUnsavedChanges,
} from '@/shared/state';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { printoutTicket } from './BlockEditorSession.travel';
import { hitToTarget, instantiateFromTemplate } from './blockEditorSession.utils';
import { resolveBlockBootstrapData } from './bootstrap';
import {
    isBlockReturnCommand,
    validateBlockReturnBootstrapInsertArt,
} from './bootstrap/blockEditorSession.bootstrap.validate';
type ProviderProps = { children: ReactNode };
type SaveResult = { ok: true; id: string } | { ok: false };

export function BlockEditorSessionProvider({ children }: ProviderProps) {
    // Global context
    const gCtxt: EditorWorkspaceContextValue = useEditorWorkspace();
    //*******************************************************/
    // Core state:
    const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>(undefined);
    // 2. Blocks collection
    const [collection, setCollection] = useState<BlocksCollectionJSON | undefined>(undefined);
    // 4. Editor block draft:
    // 5. Editor mode, used to decide if show grid or single block editor:
    const [modeStack, setModeStack] = useState<BlockEditorScreenMode[]>(['select']);
    // 6. Target used to choose if input has to shown on place of text in inlineEditor
    // Editing block element click on that called handler
    const [currentTarget, setCurrentTarget] = useState<EditTarget | undefined>(undefined);
    //*******************************************************/
    // UI / derived state
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    // editorIsReady is to identify if now a block is under editing!!!
    // LEGACY !!!!!!!!!!!!!
    // const [editorIsReady, setEditorIsReady] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [pendingSelection, setPendingSelection] = useState<SerializableBlockHitEvent | undefined>(
        undefined,
    );
    // Errors processing preparation, unimplemented.
    const [uiError, setUiError] = useState<UiErrorState | undefined>(undefined);
    // to be replaced with external stor!!!!
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
    const { storeData, setDraft, commit, clear } = sessionData;
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

    // TODO: pushMode will be used when multi-step editing is implemented
    // const pushMode = (next: BlockEditorScreenMode) => {
    //     setModeStack((s) => (s[s.length - 1] === next ? s : [...s, next]));
    // };
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
            setCollection(cl);
            gCtxt.currentBlocksCollection = cl;

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
    refreshCallbackRef.current = refreshCollection;

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

        let cl = undefined;
        (async () => {
            try {
                setLoading(true);
                // Refresh collection state
                cl = await refreshCollection();
                if (!cl) return;
                setCollection(cl);
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
                        gCtxt.refreshStreams(),
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

                /*                   
                    3) Ensure collection has the block and restore draft+snapshot into external store
                    if (!cl.blocks)
                    throw new Error('[Bootstrap]: Collection.blocks does not exist');
                    if (!block)
                    throw new Error(`[Bootstrap]: Block not found in collection: ${blockId}`);
                    
                    const key: EditorKey = { kind: 'block', id: blockId };
                    editSessionsDataStore.saveDraft(key, block);
                    editSessionsDataStore.setSnapshot(key, block);
                    */

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
                        gCtxt.setArtCatalog(freshCatalog);
                        console.log(`[INIT SESSION]: catalog refreshed with new art item`);

                        // Set edited block id
                        setSelectedBlockId(newDraft.id);
                        // Open editor in edit mode
                        setModeStack(['select', 'edit']);
                        console.log(
                            `[INIT SESSION]: screen mode set to edit, and block id is: ${newDraft.id}`,
                        );
                        // setIsJourney(false);
                        return;
                    }

                    case 'blockUpdateArt': {
                        // For update-art return we do NOT insert anything here.
                        // We only open the block in edit mode.
                        setPendingSelection(undefined);
                        setModeStack(['select', 'edit']);
                        // setIsJourney(false);
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
        resetSession();
    }, [saving, isDirty, resetSession]);

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
            // 🚧 Construction Yard:
            // Here not galleries type blocks have to be processed.
            /*
            At the moment there are two types of reactions for clicks:
                1. If clicked element is image -> editor makes journey to 
                    catalog editor

                2. If clicked element is editable text, it gets set as target
                    and element switch to editable mode.
            TO DO:
                - check if all text element are editable;
                - think out CTA block click behavior 
                    - time and date: text;
                    - place of event: text with link (point on the map: coordinates);
                    - description: text;
                    - images or videos ????;

            */
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

    // Selected (journey-like) ArtItem to editing block to pos:
    // const setSelectedArtItem = useCallback(
    //     (item: GridItem | undefined) => {
    //         console.log(`[setSelectedArtItem]: Called wit item:`);
    //         console.dir(item);

    //         if (!item || !item.id) {
    //             setPendingSelection(undefined);
    //             unHit();
    //             return;
    //         }
    //         console.log(`[setSelectedArtItem]: Called with status:`);

    //         console.dir('item:');
    //         console.dir(item);
    //         console.dir('pendingSelection:');
    //         console.dir(pendingSelection);
    //         if (!gCtxt.currentArtCatalog)
    //             throw new Error('[setSelectedArtItem]: Catalog not loaded yet');
    //         if (!gCtxt.currentArtCatalog.items[item.id])
    //             throw new Error(
    //                 '[setSelectedArtItem]: Selected ArtItem not found in current catalog',
    //             );
    //         if (
    //             pendingSelection &&
    //             pendingSelection.hit.blockKind === 'gallery' &&
    //             pendingSelection.hit.kind === 'image' &&
    //             pendingSelection.block.blockKind === 'gallery'
    //         ) {
    //             console.log(`[setSelectedArtItem]: All conditions met`);
    //             const next: GalleryBlockItem = {
    //                 artId: item.id,
    //                 position: pendingSelection.hit.slot,
    //                 caption: { en: '' },
    //             };
    //             const idx = findArtItemByPos(pendingSelection, next.position);
    //             if (!idx) {
    //                 throw new Error(`Image selected for wrong block type`);
    //             }
    //             let nextItems = [];
    //             console.log(`[setSelectedArtItem]: Selected blockItem found with index ${idx}`);

    //             // If block item with pos not found ?????
    //             if (idx === -1) {
    //                 nextItems = [...pendingSelection.block.items, next];
    //             } else {
    //                 nextItems = pendingSelection.block.items.map((it, i) =>
    //                     i === idx ? next : it,
    //                 );
    //             }
    //             const nextBlock = { ...pendingSelection.block, items: nextItems };

    //             setDraft(normalizeBlock(nextBlock));
    //             console.log(`[setSelectedArtItem]: Updated block set to:`);
    //             console.dir(nextBlock);
    //             pushMode('edit');
    //             setPendingSelection(undefined);
    //             unHit();
    //         } else {
    //             throw new Error(`[pendingSelected]: Received data doesn't match expected`);
    //         }
    //     },
    //     [pendingSelection, gCtxt.currentArtCatalog, unHit, setDraft],
    // );

    const value: BlockEditorSession = useMemo(
        () => ({
            draft,
            collection,
            setDraft,
            currentStack,
            setCollection,
            // setSelectedArtItem,
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
            setCollection,
            // setSelectedArtItem,
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
        ],
    );

    return <BlockEditorCtx.Provider value={value}>{children}</BlockEditorCtx.Provider>;
}
