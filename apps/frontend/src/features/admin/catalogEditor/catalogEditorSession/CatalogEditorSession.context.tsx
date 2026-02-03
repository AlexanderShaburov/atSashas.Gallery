// CatalogEditorSession.context.tsx

import { TechniquesJson } from '@/entities/art';
import { ArtCatalog } from '@/entities/catalog';
import { EditorTarget } from '@/entities/common';
import { CatalogGridItem, GridItem } from '@/entities/grid/gridItem';
import {
    getCatalog,
    getHopperContent,
    getSeriesOptionsCI,
    getTechniques,
    updateCatalog,
} from '@/features/admin/catalogEditor/api';
import type { ArtItemForm } from '@/features/admin/catalogEditor/catalogEditorSession/CatalogEditorSession.types/editorTypes';
import {
    buildShipment,
    prepareEditorForm,
} from '@/features/admin/catalogEditor/catalogEditorSession/editorLogic';
import { isMinimalValid, sanitizeForm } from '@/features/admin/catalogEditor/utils/Validators';
import {
    useEditorWorkspace,
    type EditorWorkspaceContextValue,
} from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import {
    useArrival,
    usePeekTicket,
    useReturnHome,
} from '@/features/admin/shared/transporter/transporter';
import { deepEqual } from '@/shared/lib/checkers/checkers';
import { EditorKey } from '@/shared/nav';
import { unsavedChangesStore, useSessionDataStore, useUnsavedChanges } from '@/shared/state';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CatalogEditorSession } from './catalogEditorSession.types';

const Ctx = createContext<CatalogEditorSession | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useEditorSession = () => {
    const v = useContext(Ctx);
    if (!v) throw new Error('useEditorSession must be used within CatalogEditorSessionProvider');
    return v;
};

type ProviderProps = { children: React.ReactNode };

export function CatalogEditorSessionProvider({ children }: ProviderProps) {
    const gCtx: EditorWorkspaceContextValue = useEditorWorkspace();

    // -----------------------------
    // Core UI state (selection/session)
    // -----------------------------
    const [identity, setIdentity] = useState<EditorTarget | undefined>(undefined);
    const [mode, setMode] = useState<'create' | 'edit'>('create');

    // Base datasets
    const [catalog, setCatalog] = useState<ArtCatalog | undefined>(undefined);
    const [hopper, setHopper] = useState<CatalogGridItem[]>([]);

    // Helpers / UI flags
    const [techniques, setTechniques] = useState<TechniquesJson>({});
    const [seriesOptions, setSeriesOptions] = useState<string[]>([]);
    const [thumb, setThumb] = useState<GridItem | undefined>(undefined);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // -----------------------------
    // Journey navigation hooks (same as Block/Stream pattern)
    // -----------------------------
    const arrival = useArrival();
    const peekTicket = usePeekTicket();
    const returnHome = useReturnHome();
    // **************** EDITOR DATA EXTRACTION (EXTERNAL STORE) ****************

    // Read saved editor values from the store:
    const key: EditorKey | undefined = selectedBlockId
        ? { kind: 'block', id: selectedBlockId }
        : undefined;
    const sessionData = useSessionDataStore<Block>(key);
    const { storeData, setDraft, commit, clear } = sessionData;
    const draft = storeData?.draft;
    const snapshot = storeData?.snapshot;
    // -----------------------------
    // External store binding (draft/snapshot)
    // Key is derived from identity (edit/create)
    // -----------------------------
    const key: EditorKey | undefined = useMemo(() => {
        if (!identity) return undefined;

        // For edit we use existing item id
        if (identity.mode === 'edit') return { kind: 'catalog', id: identity.item.id };

        // For create we use hopper item id as session id (stable enough for draft),
        // unless your prepareEditorForm generates another id. In that case the first setValues will move it.
        if (identity.mode === 'create') return { kind: 'catalog', id: identity.item.id };

        return undefined;
    }, [identity]);

    const sessionData = useSessionDataStore<ArtItemForm>(key);
    const { storeData, setDraft, setSnapshot, commit, clear } = sessionData;

    const values = storeData?.draft;
    const snapshot = storeData?.snapshot;

    // -----------------------------
    // Dirty & validity (same style as Block/Stream)
    // -----------------------------
    const scope: EditorKey | null = useMemo(() => {
        if (!values?.id) return null;
        return { kind: 'catalog', id: values.id };
    }, [values?.id]);

    const dirtyStoreState = useUnsavedChanges(scope ?? { kind: 'catalog', id: '__none__' });

    const isDirty = useMemo(() => {
        if (!values || !snapshot) return false;
        return !deepEqual(snapshot, values);
    }, [values, snapshot]);

    useEffect(() => {
        if (!scope) return;
        if (isDirty !== dirtyStoreState) {
            unsavedChangesStore.setDirty(scope, isDirty);
        }
    }, [scope, isDirty, dirtyStoreState]);

    useEffect(() => {
        if (!scope) return;
        return () => unsavedChangesStore.clear(scope);
    }, [scope]);

    const isValid = useMemo(() => {
        if (!values || !identity) return false;
        return isMinimalValid(values, identity);
    }, [values, identity]);

    const canSave = useMemo(() => !saving && isDirty && isValid, [saving, isDirty, isValid]);

    const editorIsReady = useMemo(() => !!identity && !!values, [identity, values]);

    // -----------------------------
    // Base refresh (catalog + hopper)
    // -----------------------------
    const refreshBase = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            const cat = await getCatalog();
            setCatalog(cat);
            gCtx.setArtCatalog(cat);

            const hop = await getHopperContent();
            setHopper(hop);
        } catch (e) {
            console.error('[CatalogEditorSessionProvider]: Failed to load server data:', e);
        } finally {
            setLoading(false);
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

    // Keep global workspace catalog in sync
    useEffect(() => {
        if (catalog) gCtx.setArtCatalog(catalog);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [catalog]);

    // -----------------------------
    // Session initializer (identity → draft/snapshot bootstrap)
    // IMPORTANT: identity changes should create/restore external store entries.
    // -----------------------------
    useEffect(() => {
        if (!identity) {
            setThumb(undefined);

            return;
        }

        // decide mode
        setMode(identity.mode);

        try {
            const initial = prepareEditorForm(identity);

            // bind thumb
            if (identity.mode === 'create') {
                setThumb(identity.item as GridItem);
            } else {
                setThumb({
                    id: identity.item.id,
                    thumbUrl: identity.item.images.full,
                    title: identity.item.alt,
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

    // -----------------------------
    // Mount bootstrap (Journey-aware) — same philosophy as BlockEditor bootstrap
    // -----------------------------
    useEffect(() => {
        void (async () => {
            await refreshBase();

            const ticket = arrival('catalog');
            if (!ticket) {
                // Normal “open catalog editor” case: no journey, stay idle until user selects
                setIdentity(undefined);
                setMode('create');
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
                            setIdentity(undefined);
                            setMode('create');
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

                            setIdentity({ mode: 'edit', item } as EditorTarget);
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
    // -----------------------------
    // Public setters compatible with old API
    // -----------------------------
    const setValues: React.Dispatch<React.SetStateAction<ArtItemForm | undefined>> = useCallback(
        (next) => {
            const prev = values;

            const resolved =
                typeof next === 'function'
                    ? (next as (p: ArtItemForm | undefined) => ArtItemForm | undefined)(prev)
                    : next;

            if (!resolved) {
                // If consumer clears values — clear store entry too
                clear();
                return;
            }

            // If id changed, we still store by current key (identity-derived),
            // this is OK short-term; if you want true “move session by id”, tell me and I’ll add it.
            setDraft(resolved);
        },
        [values, setDraft, clear],
    );

    // -----------------------------
    // Exit / reset
    // -----------------------------
    const resetSession = useCallback(async () => {
        // clean local selection
        setIdentity(undefined);
        setMode('create');
        setThumb(undefined);

        // clear store state for current key
        clear();

        await refreshBase();
    }, [clear, refreshBase]);

    const exit = useCallback(() => {
        if (saving) return;

        if (isDirty && !confirm('Discard unsaved changes?')) return;

        // If we are in journey return phase — we should return home with "cancel"
        const t = peekTicket();
        if (t?.phase === 'return' && t.destination.editor === 'catalog') {
            // JumpResult union in your codebase allows { ok:false } (as used in BlockEditor SaveResult style)
            returnHome('catalog', { ok: false });
            return;
        }

        void resetSession();
    }, [saving, isDirty, peekTicket, returnHome, resetSession]);

    // -----------------------------
    // Save
    // -----------------------------
    const save = useCallback(async () => {
        if (!values || !identity) return;
        if (!canSave) return;

        if (!isValid) {
            alert('Minimal required fields are missing (ID + Image).');
            return;
        }

        setSaving(true);
        try {
            const clean = sanitizeForm(values);
            const payload = buildShipment(identity, clean);

            const code = await updateCatalog(payload);
            if (code !== 200) throw new Error(`Catalog update unsuccessful! Code: ${code}`);

            // commit local external store
            commit();

            // refresh base datasets (catalog/hopper)
            await refreshBase();

            // If we are in Journey and catalog acts as selector/step, return home with ok+id
            const t = peekTicket();
            if (t?.phase === 'return' && t.destination.editor === 'catalog') {
                returnHome('catalog', { ok: true, id: clean.id });
                return;
            }
        } catch (e) {
            console.error('[CatalogEditorSessionProvider]: Save failed', e);
        } finally {
            setSaving(false);
        }
    }, [values, identity, canSave, isValid, commit, refreshBase, peekTicket, returnHome]);

    const value: CatalogEditorSession = useMemo(
        () => ({
            mode,
            catalog,
            hopper,
            identity,
            values,
            setIdentity,
            setValues,
            setMode,

            editorIsReady,

            isDirty,
            isValid,
            canSave,
            loading,

            saving,
            save,
            exit,

            thumb,
            techniques,
            seriesOptions,
        }),
        [
            mode,
            catalog,
            hopper,
            identity,
            values,
            setIdentity,
            setValues,
            editorIsReady,
            isDirty,
            isValid,
            canSave,
            loading,
            saving,
            save,
            exit,
            thumb,
            techniques,
            seriesOptions,
        ],
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
