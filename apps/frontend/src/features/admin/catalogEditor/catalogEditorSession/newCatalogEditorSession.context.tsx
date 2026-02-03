// src/features/admin/catalogEditor/catalogEditorSession/newCatalogEditorSession.context.tsx

import { ArtItemData, TechniquesJson } from '@/entities/art';
import { ArtCatalog } from '@/entities/catalog';
import { GridItem } from '@/entities/grid';
import { CatalogGridItem } from '@/entities/grid/gridItem';
import {
    EditorWorkspaceContextValue,
    useEditorWorkspace,
} from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import {
    useArrival,
    usePeekTicket,
    useReturnHome,
} from '@/features/admin/shared/transporter/transporter';
import {
    ProviderProps,
    SingleItemEditorProps,
} from '@/pages/admin/catalogEditorPage/NewCatalogEditor.types';
import { deepEqual } from '@/shared/lib/checkers/checkers';
import { EditorKey } from '@/shared/nav';
import { unsavedChangesStore, useSessionDataStore, useUnsavedChanges } from '@/shared/state';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCatalog, getHopperContent, getSeriesOptionsCI, getTechniques } from '../api';
import { isMinimalValid } from '../utils/Validators';
import { CatalogEditorSession } from './catalogEditorSession.types';
import { CatalogEditorScreenMode } from './CatalogEditorSession.types/CatalogEditorSession.types';
import { editorFormConvertor } from './editorLogic/editorLogic';

const Ctx = createContext<CatalogEditorSession | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useCatalogEditorSession = () => {
    const v = useContext(Ctx);
    if (!v) throw new Error('useEditorSession must be used within CatalogEditorSessionProvider');
    return v;
};

export function CatalogEditorSessionProvider({ children }: ProviderProps) {
    const gCtx: EditorWorkspaceContextValue = useEditorWorkspace();

    // Core state:
    // 1. Use as logic trigger and reference:
    const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
    // 2. Catalog dataset:
    const [catalog, setCatalog] = useState<ArtCatalog | undefined>(undefined);
    // 3. Hopper dataset:
    const [hopper, setHopper] = useState<CatalogGridItem[]>([]);
    // 4. Current techniques database analytics result
    const [techniques, setTechniques] = useState<TechniquesJson>({});
    // 5. Current series database analytics result
    const [seriesOptions, setSeriesOptions] = useState<string[]>([]);
    // 6. Selected artItem thumbnail image url:
    const [thumb, setThumb] = useState<GridItem | undefined>(undefined);

    // UI states:
    const [screenMode, setScreenMode] = useState<CatalogEditorScreenMode>('select');
    const isSelected = screenMode === 'edit' && selectedItemId;
    // API process states:
    const [isLoading, setIsLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // -----------------------------
    // Journey navigation hooks (same as Block/Stream pattern)
    // -----------------------------
    const arrival = useArrival();
    const peekTicket = usePeekTicket();
    const returnHome = useReturnHome();

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
    const { storeData, setDraft, commit, clear } = sessionData;
    const draft = storeData?.draft;
    const snapshot = storeData?.snapshot;

    // Single Item Editor state calculator:
    const editorIsReady = useMemo(() => {
        return isSelected && draft && techniques && seriesOptions;
    }, [draft, isSelected, techniques, seriesOptions]);
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
        if (!isSelected) return;
        return () => unsavedChangesStore.clear(scope);
    });

    // Data validator actuator:
    const isValid = useMemo(() => {
        if (!draft || !selectedItemId || !isSelected) return false;
        return isMinimalValid(draft);
    }, [draft, isSelected, selectedItemId]);

    const canSave = useMemo(() => !saving && !isDirty && isValid, [saving, isDirty, isValid]);

    // 🚧 Construction Yard:

    // -----------------------------
    // Base refresh (catalog + hopper)
    // -----------------------------
    const refreshBase = useCallback(async (): Promise<void> => {
        try {
            setIsLoading(true);
            const cat = await getCatalog();
            setCatalog(cat);
            gCtx.setArtCatalog(cat);

            const hop = await getHopperContent();
            setHopper(hop);
        } catch (e) {
            console.error('[CatalogEditorSessionProvider]: Failed to load server data:', e);
        } finally {
            setIsLoading(false);
        }
    }, [gCtx]);

    // One-time load of techniques + series options
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const tech = await getTechniques();
                const s = await getSeriesOptionsCI();
                if (!alive) return;
                setTechniques(tech);
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
        void (async () => {
            await refreshBase();
            const ticket = arrival('catalog');
            if (!ticket) {
                //Open catalog editor in 'select' screenMode
                setScreenMode('select');
                return;
            }
            console.log('[Catalog BOOTSTRAP]: ticket received:');
            console.dir(ticket);
            switch (ticket.phase) {
                case 'outbound': {
                    // Someone navigated TO catalog editor
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
                                throw new Error(
                                    '[Catalog BOOTSTRAP]: outbound edit missing objectId',
                                );

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
                }

                case 'return': {
                    /**
                     * Return-to-catalog leg means: catalog initiated a journey to another editor
                     * (most likely hopper) and now received luggage.
                     *
                     * I’m leaving a SAFE skeleton here because you didn’t provide the catalog-specific
                     * return commands/types yet.
                     */
                    console.log('[Catalog BOOTSTRAP]: return leg. ticket:');
                    console.dir(ticket);

                    // If you later add catalog return commands, handle them here by inspecting:
                    // - ticket.returnEffect
                    // - ticket.loot
                    // For now we just keep current state intact.
                    return;
                }
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    /* 
🚧 Refactor catalog editor logic to:  🚧

1. There are two screenMode: 'edit' and 'select'
    - 'edit' is for edit metadata of selected item;
        While screenMode is 'edit' UI shows us single item editor with 
        selected item;
    - 'select' is for select item form catalog to edit (or to apply as selected for elder editor)
        While screenMode is 'select' UI shows us catalog grit (!!!REMEMBER FOCUS!!!)

2. To create new item should be newItem button, which send as to a journey to the hopper
    where downloaded items display as grid and is the Download new button.




*/
    // set values according selected id:
    useEffect(() => {
        if (!isSelected || !draft) {
            setThumb(undefined);
            return;
        }

        // decide mode
        setScreenMode('edit');

        try {
            const initial = editorFormConvertor(draft);

            // bind thumb
            if (draft.lifecycle === 'template') {
                setThumb(identity.item as GridItem);
            } else {
                setThumb({
                    id: draft.id,
                    thumbUrl: draft.images.full,
                    title: draft.alt,
                } as GridItem);
            }

            // external store init:
            // - draft set to prepared form
            // - snapshot set to same baseline (clean)
            setDraft(initial);
            setSnapshot(initial);
        } catch (e) {
            console.error('[CatalogEditorSessionProvider]: Failed to init session:', e);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identity]);

    // Single item editor props object:
    const editorProps: SingleItemEditorProps = useMemo(() => {
        return {
            id: selectedItemId,
            techniques,
            seriesOptions,
            thumb,
            isDirty,
            onApply,
            onSave,
            onDelete,
            onExit,
        };
    }, [isDirty, selectedItemId, seriesOptions, thumb, techniques]);
    const value: CatalogEditorSession = useMemo(
        () => ({
            editorProps,
            catalog,
            hopper,
            onSelect,
            canSave,
            editorIsReady,
            isLoading,
            screenMode,
            isSelected,
            onExit,
        }),
        [editorProps, catalog, hopper, canSave, editorIsReady, screenMode, isSelected, isLoading],
    );
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
