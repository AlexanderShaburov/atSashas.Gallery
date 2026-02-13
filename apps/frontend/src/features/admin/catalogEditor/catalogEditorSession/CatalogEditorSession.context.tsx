// src/features/admin/catalogEditor/catalogEditorSession/newCatalogEditorSession.context.tsx

import { ArtItem, ArtItemData, TechniquesJson } from '@/entities/art';
import { ArtCatalog } from '@/entities/catalog';
import { GridItem } from '@/entities/grid';
import { CatalogEditorScreenMode } from '@/features/admin/catalogEditor/catalogEditorSession/catalogEditorSession.types';
import { draftToShipmentConvertor } from '@/features/admin/catalogEditor/catalogEditorSession/editorLogic/editorLogic';
import { printoutTicket } from '@/features/admin/catalogEditor/catalogEditorSession/journeyService';
import { isMinimalValid, sanitizeForm } from '@/features/admin/catalogEditor/utils/Validators';
import {
    EditorWorkspaceContextValue,
    useEditorWorkspace,
} from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import {
    useArrival,
    useDispatch,
    useJourneyStatus,
    useReturnHome,
} from '@/features/admin/shared/transporter/transporter';
import {
    ProviderProps,
    SingleItemEditorProps,
} from '@/pages/admin/catalogEditorPage/catalogEditor.types';
import { deepEqual } from '@/shared/lib/checkers/checkers';
import { EditorKey, JourneyHome } from '@/shared/nav';
import {
    editSessionsDataStore,
    unsavedChangesStore,
    useSessionDataStore,
    useUnsavedChanges,
} from '@/shared/state';
import {
    CatalogCommands,
    CatalogToolbarModel,
} from '@/shared/ui/SingleEditorToolbar/single-editor-toolbar.types';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    getCatalog,
    getSeriesOptionsCI,
    getTechniques,
    updateCatalog,
} from '../api';
import { useDependencyAwareDeletion } from '../hooks/useDependencyAwareDeletion';
import { CatalogEditorSession } from './catalogEditorSession.types';
import { newArtItemFromGrid } from './editorLogic/newArtItemFromGrid';
type SaveResult = { ok: true; id: string } | { ok: false };

const Ctx = createContext<CatalogEditorSession | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useCatalogEditorSession = () => {
    const v = useContext(Ctx);
    if (!v) throw new Error('useEditorSession must be used within CatalogEditorSessionProvider');
    return v;
};

export function CatalogEditorSessionProvider({ children }: ProviderProps) {
    const gCtx: EditorWorkspaceContextValue = useEditorWorkspace();

    // Ref to hold refresh callback for deletion hook
    const refreshCallbackRef = useRef<(() => Promise<void>) | null>(null);

    // Dependency-aware deletion hook
    const { deleteArtItem: deleteArtItemWithDeps } = useDependencyAwareDeletion({
        onRefresh: async () => {
            if (refreshCallbackRef.current) {
                await refreshCallbackRef.current();
            }
        },
    });

    // Core state:
    // 1. Use as logic trigger and reference:
    const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
    // 2. Catalog dataset:
    const [catalog, setCatalog] = useState<ArtCatalog | undefined>(undefined);

    // 3. Current techniques database analytics result
    const [techniquesRange, setTechniquesRange] = useState<TechniquesJson>({});
    // 4. Current series database analytics result
    const [seriesOptions, setSeriesOptions] = useState<string[]>([]);
    // 5. Selected artItem thumbnail image url:
    const [thumb, setThumb] = useState<GridItem | undefined>(undefined);

    // UI states:
    const [screenMode, setScreenMode] = useState<CatalogEditorScreenMode>('select');

    // React Strict Mode protection for bootstrap
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bootstrapRef = useRef<{ processed: boolean; ticket: any }>({
        processed: false,
        ticket: null,
    });
    const isSelected = screenMode === 'edit' && !!selectedItemId;
    // API process states:
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // -----------------------------
    // Journey navigation hooks (same as Block/Stream pattern)
    // -----------------------------
    const arrival = useArrival();
    const returnHome = useReturnHome();
    const dispatch = useDispatch();

    // NEW: Derived journey state (replaces local useState)
    const isJourney = useJourneyStatus('catalog');

    // **************** EDITOR DATA EXTRACTION (EXTERNAL STORE) ****************

    // Read saved editor values from the store:
    // -----------------------------
    // External store binding (draft/snapshot)
    // -----------------------------
    // Scope (key) is derived from selected item id:
    const scope: EditorKey | undefined = useMemo(() => {
        return isSelected ? { kind: 'catalog', id: selectedItemId } : undefined;
    }, [isSelected, selectedItemId]);

    const sessionData = useSessionDataStore<ArtItemData>(scope);
    const { storeData, setDraft, commit } = sessionData;
    const draft = storeData?.draft;
    const snapshot = storeData?.snapshot;

    // Single Item Editor state calculator:
    const editorIsReady = useMemo(() => {
        return isSelected && !!draft && !!techniquesRange && !!seriesOptions;
    }, [draft, isSelected, techniquesRange, seriesOptions]);
    // -----------------------------
    // Dirty & validity (same style as Block/Stream)
    // -----------------------------

    // External store dirty state value:
    const dirtyStoreState = useUnsavedChanges(scope ?? { kind: 'catalog', id: '__none__' });

    // Local dirty state calculator
    const isDirty = useMemo(() => {
        if (!draft || !snapshot) return false;
        return !deepEqual(snapshot, draft);
    }, [draft, snapshot]);

    // local <-> external isDirty state synchronizer:
    useEffect(() => {
        if (!isSelected || !scope) return;
        if (isDirty !== dirtyStoreState) {
            unsavedChangesStore.setDirty(scope, isDirty);
        }
    }, [scope, isSelected, isDirty, dirtyStoreState]);

    // External dirty state cleanup callback:
    useEffect(() => {
        if (!isSelected || !scope) return;
        return () => unsavedChangesStore.clear(scope);
    }, [isSelected, scope]);

    // Data validator actuator:
    const isValid = useMemo(() => {
        if (!draft || !selectedItemId || !isSelected) return false;
        return isMinimalValid(draft);
    }, [draft, isSelected, selectedItemId]);

    const canSave = useMemo(() => !isSaving && isDirty && isValid, [isSaving, isDirty, isValid]);

    // 🚧 Construction Yard:

    // -----------------------------
    // Base refresh (catalog + hopper)
    // -----------------------------
    const refreshBase = useCallback(async (): Promise<void> => {
        try {
            console.log(`[refreshBase]: called`);
            setIsLoading(true);
            const cat = await getCatalog();
            console.log(`[refreshBase]: current catalog received`);
            setCatalog(cat);
            console.log(`[refreshBase]: current catalog saved to state`);
            gCtx.setArtCatalog(cat); //LEGACY
            console.log(`[refreshBase]: current catalog saved to global context`);
        } catch (e) {
            console.error(`[CatalogEditorSessionProvider]: Failed to load server data: ${e}`);
        } finally {
            setIsLoading(false);
        }
    }, [gCtx]);

    // Store refreshBase in ref for deletion hook
    refreshCallbackRef.current = refreshBase;

    // Start new editor session:
    const resetSession = useCallback(
        () =>
            void (async () => {
                console.log(`[resetSession]: called`);
                setSelectedItemId(undefined);
                console.log(`[resetSession]: selectedItemId reset`);
                setScreenMode('select');
                console.log(`[resetSession]: screenMode set to select`);
                await refreshBase();
                console.log(`[resetSession]: refreshBase complete`);
            })(),
        [refreshBase],
    );

    // One-time load of techniquesRange + series options
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const tech = await getTechniques();
                const s = await getSeriesOptionsCI();
                if (!alive) return;
                setTechniquesRange(tech);
                setSeriesOptions(s);
            } catch (err) {
                console.error(
                    '[CatalogEditorSessionProvider]: Failed to load techniques/options:',
                    err,
                );
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // Keep global workspace catalog in sync ????
    useEffect(() => {
        if (catalog) gCtx.setArtCatalog(catalog);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [catalog]);

    // *********** MOUNT BOOTSTRAP ***********

    /*
    ❗️❗️❗️ 
    According previous logic new artItem been created by setting mode to create
    what switched UI to Hopper view and user could select item.
    Selected item returned to editor as GridItem (as it was saving in hopper)

    Now we have to either prolong Journey mechanics to hopper or emulate create mode
    by another state or trigger.

    As a good idea looks to add toolbar to select mode with new artItem button
    or add template as first thumbnail to art items grid. Or both of two.

    For new item template and add item button, handler can create ticket and 
    jump to hopper. 
    The issue is hopper page doesn't have context yet. Maybe it can be 
    done by code in component with direct access or using hooks 

    Yes, having external store for journey data, context isn't necessary.
    ❗️❗️❗️
    */

    useEffect(() => {
        console.log('[Catalog BOOTSTRAP]: Effect started');

        // React Strict Mode protection: Only process once
        if (bootstrapRef.current.processed) {
            console.log('[Catalog BOOTSTRAP]: Skipping - already processed');
            return;
        }

        // CRITICAL: Call arrival() synchronously FIRST, before any async operations
        // This prevents race conditions in React Strict Mode
        const ticket = arrival('catalog');
        console.log('[Catalog BOOTSTRAP]: ticket received:');
        console.dir(ticket);

        // Mark as processed and store ticket
        bootstrapRef.current = { processed: true, ticket };

        void (async () => {
            await refreshBase();
            if (!ticket) {
                //Open catalog editor in 'select' screenMode
                setScreenMode('select');
                return;
            }

            // Check if this is a return (has loot) or outbound (no loot)
            // Note: tickets always have phase='outbound', the leg state determines if it's returning
            if (!ticket.loot) {
                // OUTBOUND: Someone navigated TO catalog editor
                // isJourney now derived from useJourneyStatus() - no manual setting needed
                // We support:
                // - destination.mode === 'select' (pick an art item)
                // - destination.mode === 'edit'   (open specific item id)
                switch (ticket.destination.mode) {
                    case 'select': {
                        setScreenMode('select');
                        return;
                    }
                    case 'edit': {
                        const id = ticket.destination.objectId;
                        if (!id)
                            throw new Error('[Catalog BOOTSTRAP]: outbound edit missing objectId');

                        // We need catalog to resolve item
                        const cat = (await getCatalog()) as ArtCatalog;
                        setCatalog(cat);
                        gCtx.setArtCatalog(cat);

                        const item = cat.items?.[id];
                        if (!item)
                            throw new Error(
                                `[Catalog BOOTSTRAP]: ArtItem not found in catalog: ${id}`,
                            );

                        setSelectedItemId(id);
                        setScreenMode('edit');
                        return;
                    }
                    default:
                        throw new Error(
                            '[Catalog BOOTSTRAP]: Unsupported outbound destination.mode',
                        );
                }
            } else {
                // RETURN: Returning from child editor with loot
                console.log(`[Catalog BOOTSTRAP]: RETURN ticket with loot`);

                // Check if this is a dependency resolution return
                if (ticket.returnEffect?.kind === 'dependencyResolved') {
                    console.log(`[Catalog BOOTSTRAP]: Dependency resolution return detected`);

                    // User fixed a dependency in block/stream editor
                    // Refresh ALL data (catalog, blocks, streams) and re-trigger dependency check
                    console.log(`[Catalog BOOTSTRAP]: Refreshing all data sources...`);

                    // Refresh in parallel
                    await Promise.all([
                        refreshBase(),
                        gCtx.refreshBlocks(),
                        gCtx.refreshStreams(),
                    ]);

                    console.log(`[Catalog BOOTSTRAP]: All data refreshed`);

                    // Fetch fresh catalog directly (don't use stale state)
                    const targetId = ticket.returnEffect.targetId;
                    const freshCatalog = await getCatalog();
                    const artItem = freshCatalog.items?.[targetId];

                    if (artItem) {
                        console.log(`[Catalog BOOTSTRAP]: Re-checking dependencies for ${targetId}`);
                        // Convert ArtItemData to ArtItem instance and re-trigger dependency-aware deletion
                        const artItemInstance = ArtItem.fromJSON(artItem);
                        void deleteArtItemWithDeps(artItemInstance);
                    } else {
                        console.warn(`[Catalog BOOTSTRAP]: Target art item ${targetId} not found after dependency resolution`);
                        setScreenMode('select');
                    }
                    return;
                }

                /*❗️
                    Important notice: as a result, journey to hopper has to have left created artItem
                    object added into the catalog with id, initially transferred to ticket
                    ❗️*/
                console.log(`[Catalog BOOTSTRAP]: RETURN ticket presented.`);
                if (ticket.returnTo.mode !== 'edit')
                    throw new Error(`Impossible return to catalog  editor`);
                if (!ticket.loot) throw new Error(`Impossible return to catalog not having loot`);
                if (!ticket.loot.ok)
                    throw new Error(`Impossible return to catalog not having loot`);

                // Fetch catalog directly to avoid stale state from refreshBase()
                const cat = (await getCatalog()) as ArtCatalog;
                setCatalog(cat);
                console.log(`[Catalog BOOTSTRAP]: Catalog renewed`);
                // Save catalog to the global context /LEGACY -> TO BE REFACTORED
                gCtx.setArtCatalog(cat);
                // Get loot id, this particular case it is hopper temporal image id, means nothing.
                // Get looted image:
                const loot = ticket.loot.output;
                console.log(`[Catalog BOOTSTRAP]: Loot checkup starts:`);
                if (!loot) {
                    //If no loot -> open catalog editor in 'select' screenMode
                    console.log(`[Catalog BOOTSTRAP]: Journey to hopper doesn't brought any loot`);
                    setScreenMode('select');
                    return;
                }
                console.log(`[Catalog BOOTSTRAP]: Loot detected`);
                // Create new ArtItemData object with 'draft' lifecycle, what lead us
                // to hopper kind image in shipment object and makes backend generate
                // previews
                const newDraft = newArtItemFromGrid(loot);
                console.log(`[Catalog BOOTSTRAP]: newDraft created based on loot`);
                console.dir(newDraft);

                setSelectedItemId(newDraft.id);
                console.log(`[Catalog BOOTSTRAP]: selectedItemId state set`);

                const key: EditorKey = { kind: 'catalog', id: newDraft.id };
                console.log(`[Catalog BOOTSTRAP]: formed key as:`);
                console.dir(key);
                editSessionsDataStore.saveDraft<ArtItemData>(key, newDraft);
                editSessionsDataStore.commit<ArtItemData>(key);
                console.log(`[Catalog BOOTSTRAP]: Created draft saved to store and committed`);

                setThumb({
                    id: newDraft.id,
                    thumbUrl: newDraft.images.full,
                    title: newDraft.title?.en ?? '',
                });
                console.log(`[Catalog BOOTSTRAP]: Thumb state set as:`);
                console.dir({
                    id: newDraft.id,
                    thumbUrl: newDraft.images.full,
                    title: newDraft.title?.en ?? '',
                });

                setScreenMode('edit');
                console.log(`[Catalog BOOTSTRAP]: Screen mode set to edit`);

                console.log('[Catalog BOOTSTRAP]: return leg. ticket:');
                console.dir(ticket);
                return;
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ************** HANDLERS DEPARTMENT **************

    // ************** CREATE NEW ART ITEM **************
    const onAdd = useCallback(() => {
        const ticket = printoutTicket();

        // NEW: Provide home when starting journey to Hopper
        const home: JourneyHome = {
            editor: 'catalog',
            objectId: selectedItemId, // May be undefined if in select mode
        };

        dispatch(ticket, home);
        // Create new art item:
    }, [dispatch, selectedItemId]);

    // *************** SELECT AND EDIT ****************
    const editById = useCallback(
        (id: string) => {
            if (!catalog) {
                console.error(`Item selected while catalog not downloaded`);
                return;
            }
            // Set selected item as edited and change screenMode to 'edit'
            setSelectedItemId(id);
            const item = catalog.items[id];
            if (!item) {
                console.error(`Selected item not found in catalog`);
                return;
            }
            const key: EditorKey = { kind: 'catalog', id };
            editSessionsDataStore.saveDraft<ArtItemData>(key, item);
            editSessionsDataStore.commit<ArtItemData>(key);
            setThumb({
                id: item.id,
                thumbUrl: item.images.full,
                title: item.title?.en ?? '',
            });
            setScreenMode('edit');
        },
        [catalog],
    );

    const deleteById = useCallback(
        (id: string) => {
            console.log(`[CatalogEditor][deleteById]: Called with id: ${id}`);

            // Find the art item to delete
            const artItemData = catalog?.items?.[id];
            if (!artItemData) {
                console.error(`[CatalogEditor][deleteById]: Art item not found: ${id}`);
                return;
            }

            // Convert to ArtItem instance and use dependency-aware deletion
            const artItem = ArtItem.fromJSON(artItemData);
            void deleteArtItemWithDeps(artItem);
        },
        [catalog, deleteArtItemWithDeps],
    );

    const finalizeAfterSave = useCallback(
        (savedId: string) => {
            console.log(`[finalizeAfterSave]: called`);
            // If in a journey, return home with the saved art item ID
            if (isJourney) {
                console.log(
                    `[finalizeAfterSave]: in journey, returning home with artItemId: ${savedId}`,
                );
                returnHome('catalog', { ok: true, id: savedId });
            }
            resetSession();
        },
        [isJourney, returnHome, resetSession],
    );

    // ----------------- Save procedure -----------------

    const save = useCallback(async (): Promise<SaveResult> => {
        if (!draft) return { ok: false };

        setIsSaving(true);
        try {
            const clean = sanitizeForm(draft);
            const payload = draftToShipmentConvertor(clean);

            const code = await updateCatalog(payload);
            if (code !== 200) throw new Error(`Catalog update unsuccessful! Code: ${code}`);
            // commit local external store
            commit();

            // refresh base datasets (catalog/hopper)
        } catch (err) {
            console.error(`Failed to save art item: ${err}`);
            return { ok: false };
        } finally {
            await refreshBase();
            setIsSaving(false);
        }

        // 🚧 Here, after item has saved, journey inspection has to be implemented:
        // if we are in journey, return home procedure should be completed, as in the block editor.
        return { ok: true, id: draft.id };
    }, [commit, draft, refreshBase]);
    // ******** After save processing ********

    // ----------- APPLY ------------
    // apply button handler
    const applyById = useCallback(
        (id: string) => {
            // Convey selected item to journey
            void (async () => {
                if (!isJourney || !id) return;

                // If there are unsaved changes (creating/editing), save first
                // Otherwise (just selecting existing item), return directly
                if (isDirty && draft) {
                    console.log('[applyById]: Unsaved changes detected, saving before return...');
                    const saveResult = await save();

                    if (!saveResult.ok) {
                        console.error('[applyById]: Save failed, not returning');
                        return;
                    }

                    console.log('[applyById]: Save successful, returning home');
                    finalizeAfterSave(saveResult.id);
                } else {
                    console.log(
                        '[applyById]: No unsaved changes, returning directly with selected id',
                    );
                    finalizeAfterSave(id);
                }
            })();
        },
        [draft, finalizeAfterSave, isDirty, isJourney, save],
    );
    // ---------- EXIT ---------
    // exit button handler
    const exit = useCallback(() => {
        console.log(`[EXIT]: called`);
        //Jump one level up
        if (isSaving) {
            console.log(`[EXIT]: isSaving === true detected`);
            return;
        }
        if (isDirty && !confirm(`Discard unsaved art item changes?`)) return;
        console.log(`[EXIT]: isDirty and Discard changes check passed`);
        resetSession();
        console.log(`[EXIT]: Session reset`);
    }, [isSaving, isDirty, resetSession]);

    // ----------- SAVE ----------
    // save button handler
    const onSaveClick = useCallback(
        () =>
            void (async () => {
                console.log(`[onSaveClick]: called`);
                // Complete presave check and save, possibly convey to journey
                const r = await save();
                console.log(`[onSaveClick]: save completed with result:`);
                console.dir(r);
                console.log(`[onSaveClick]: isJourney state is ${isJourney}`);
                if (r.ok && isJourney) finalizeAfterSave(r.id);
            })(),
        [finalizeAfterSave, save, isJourney],
    );

    const onChangeTags = useCallback(
        (next: string[] | undefined) => {
            // Transfer here form UI
            if (!draft) return;
            if (!next) return;
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

    const onDraftChange = useCallback((next: ArtItemData) => setDraft(next), [setDraft]);
    // ************** END OF HANDLERS DEPARTMENT **************

    // Single item editor props object:
    const editorProps: SingleItemEditorProps = useMemo(() => {
        return {
            // Data:
            id: selectedItemId,
            techniquesRange,
            seriesOptions,
            thumb,

            // Derived flags:
            isDirty,
            draft,
            editorIsReady,

            // Setters:
            onDraftChange,
        };
    }, [
        selectedItemId,
        draft,
        onDraftChange,
        seriesOptions,
        editorIsReady,
        thumb,
        isDirty,
        techniquesRange,
    ]);

    const toolbarModel: CatalogToolbarModel = useMemo(() => {
        return {
            canSave,
            isSaving,
            tags: draft?.tags,
            commands: {
                add: onAdd,
                editById,
                deleteById,
                applyById,
                save: onSaveClick,
                exit,
                onChangeTags,
            } as CatalogCommands,
        };
    }, [
        canSave,
        isSaving,
        applyById,
        editById,
        deleteById,
        onAdd,
        onSaveClick,
        exit,
        onChangeTags,
        draft?.tags,
    ]);
    const value: CatalogEditorSession = useMemo(
        () => ({
            // Props:
            editorProps,
            toolbarModel,

            // Data:
            catalog,
            draft,

            // Handlers
            onEscape: exit,

            // Derived flags:
            screenMode,
            isSelected,
            editorIsReady,
            isLoading,
        }),
        [
            editorProps,
            screenMode,
            draft,
            catalog,
            toolbarModel,
            editorIsReady,
            isSelected,
            isLoading,
            exit,
        ],
    );
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
