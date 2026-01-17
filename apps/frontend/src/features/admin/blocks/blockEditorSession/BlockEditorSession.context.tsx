// src/features/admin/blocks/editorSession/BlockEditorSession.context.tsx

import type {
    Block,
    BlockEditorMode,
    BlockEditorScreenMode,
    BlocksCollectionJSON,
    EditTarget,
    GalleryBlockItem,
} from '@/entities/block';
import type { UiErrorState } from '@/entities/common';
import { GridItem } from '@/entities/grid';
import type { EditorWorkspaceContextValue } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { addNewBlock, getCollection, updateBlock } from '@/features/admin/blocks/api/blocksApi';
import { normalizeBlock } from '@/features/admin/blocks/editorSession';
import type {
    BlockEditorSession,
    ScreenModeStack,
} from '@/features/admin/blocks/editorSession/block-editor.types';
import { BlockEditorCtx } from '@/features/admin/blocks/hooks/useBlocksEditor';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
import { validateBlockForm } from '@/features/admin/blocks/utils';
import { deepEqual } from '@/shared/lib/checkers/checkers';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { hitToTarget, instantiateFromTemplate } from './blockEditorSession.utils';

type ProviderProps = { children: ReactNode };

export function BlockEditorSessionProvider({ children }: ProviderProps) {
    // Global context
    const gCtxt: EditorWorkspaceContextValue = useEditorWorkspace();
    //*******************************************************/
    // Core state:
    // 1. Editor mode, used to decide if show templates(????)
    const [mode, setMode] = useState<BlockEditorMode>('create');
    // 2. Blocks collection
    const [collection, setCollection] = useState<BlocksCollectionJSON | undefined>(undefined);
    // 3. Selected block
    const [selectedBlock, setSelectedBlock] = useState<Block | undefined>(undefined);
    // 4. Editor form values:
    const [values, setValues] = useState<Block | undefined>(undefined);
    // 5. Editor mode, used to decide if show grid or single block editor:
    const [modeStack, setModeStack] = useState<BlockEditorScreenMode[]>(['select']);
    // 6. Target used to choose if input has to shown on place of text in inlineEditor
    const [currentTarget, setCurrentTarget] = useState<EditTarget | undefined>(undefined);
    // 7. Art catalog:
    //*******************************************************/
    // UI / derived state
    // 8
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    // editorIsReady is to identify if now a block is under editing!!!
    const [editorIsReady, setEditorIsReady] = useState(false);
    const [pendingSelection, setPendingSelection] = useState<BlockHitEvent | undefined>(undefined);

    const [uiError, setUiError] = useState<UiErrorState | undefined>(undefined);

    const snapshot = useRef<Block | undefined>(undefined);
    // const valuesRef = useRef<Block | undefined>(values);
    //*******************************************************/

    // !!!!!!!!!!!!! TRACERS !!!!!!!!!!!!!!
    useEffect(() => {
        console.log(`[pendingSelection TRACER]: state changed to:`);
        console.dir(pendingSelection);
    }, [pendingSelection]);
    // !!!!!!!!!!!!! TRACERS END !!!!!!!!!!!!!!

    // ************** LOGICS **************

    const isValid = useMemo(() => (values ? validateBlockForm(values) : false), [values]);

    const isDirty = useMemo(() => {
        if (!values) return false;
        if (!selectedBlock) return true;
        return !deepEqual(snapshot.current, values);
    }, [values, selectedBlock]);

    const canSave = useMemo(() => !saving && isDirty && isValid, [saving, isDirty, isValid]);

    // ************** LOGICS END **************

    // ************** STACK CONTROL **************

    const pushMode = (next: BlockEditorScreenMode) => {
        setModeStack((s) => (s[s.length - 1] === next ? s : [...s, next]));
    };
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
        try {
            setLoading(true);

            // Download and set collections list
            const cl = await getCollection();
            console.dir(`[BlockEditorSession.context][refreshCollection] cl: ${cl}`);
            setCollection(cl);

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

    // initial load
    useEffect(() => {
        (async () => {
            await refreshCollection();
        })();
    }, [refreshCollection]);

    // Reset session helper
    const resetSession = useCallback(() => {
        setSelectedBlock(undefined);
        setValues(undefined);
        setEditorIsReady(false);
        snapshot.current = undefined;
        setMode('create');
        pushMode('select');
    }, []);

    // ------------------------------------
    // *********** INIT SESSION ***********
    // ------------------------------------

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                console.log('[INIT SESSION]: started');
                // Refresh collection state
                const cl = await refreshCollection();

                if (!cl) throw new Error('Collection is empty');

                // Check if workspace has block id selected
                // If not reset Editor session to initial empty values
                if (!gCtxt.currentBlockId) {
                    resetSession();
                    return;
                }

                // If block id selected -> find block in collection and set its data to form values

                const bl = cl.blocks[gCtxt.currentBlockId];

                if (!bl) {
                    setUiError({
                        title: 'Block not found',
                        message:
                            `Block "${gCtxt.currentBlockId}" was not found. ` +
                            `The editor will be opened in create mode.`,
                        onConfirm: () => {
                            gCtxt.setBlock(undefined);
                            resetSession();
                        },
                    });
                    resetSession();
                    return;
                }

                setSelectedBlock(bl);
                setValues(normalizeBlock(bl));
                setMode('edit');
            } catch (e) {
                console.error(`BlockEditorSession error: ${e}`);
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshCollection]);

    const save = useCallback(async () => {
        if (!values || !canSave) return;
        setSaving(true);
        try {
            if (!selectedBlock && !!values) {
                addNewBlock(values);
            }
            if (!!selectedBlock && !!values) {
                updateBlock(values);
            }

            await refreshCollection();
            pushMode('select');
            setSelectedBlock(undefined);
            setValues(undefined);
            snapshot.current = undefined;
        } catch (e) {
            console.error('Failed to save block:', e);
        } finally {
            setSaving(false);
        }
    }, [values, canSave, refreshCollection, selectedBlock]);

    const exit = useCallback(() => {
        if (saving) return;
        if (isDirty && !confirm('Discard unsaved block changes?')) return;
        resetSession();
    }, [saving, isDirty, resetSession]);

    const handleEditHit = useCallback(
        (hit: BlockHitEvent) => {
            console.log(`[handleEditHit]: edit mode hit detected`);
            console.dir(hit);

            if (currentStack.screenMode !== 'edit') return;
            const tg = hitToTarget(hit);

            if (tg.blockKind === 'gallery' && tg.kind == 'image') {
                setPendingSelection(hit);
                pushMode('pickArt');
                console.log(`[handleEditHit]: pendingSelection set to hit`);
                console.log(`[handleEditHit]: screenMode set to pickArt`);
            } else {
                setCurrentTarget(tg);
                console.log(`[handleEditHit]: currentTarget set to th:`);
                console.dir(tg);
            }
        },
        [currentStack.screenMode],
    );
    const handleSelectHit = useCallback((hit: BlockHitEvent) => {
        switch (hit.block.lifecycle) {
            case 'draft':
                console.warn(
                    `[handleSelectHit]: Block ${hit.block.id} has inappropriate lifecycle type 'draft'!`,
                );
                setValues(hit.block);
                setSelectedBlock(undefined);
                break;
            case 'saved':
                setSelectedBlock(hit.block);
                setValues(normalizeBlock(hit.block));
                break;
            case 'template':
                setSelectedBlock(undefined);
                setValues(instantiateFromTemplate(hit.block));
                break;
        }
        pushMode('edit');
    }, []);

    const onHit = useCallback(
        (hit: BlockHitEvent) => {
            console.log(`[BlockEditorSessionProvider]: edit mode hit detected`);
            console.dir(hit);

            if (currentStack.screenMode === 'select') handleSelectHit(hit);
            else handleEditHit(hit);
        },
        [currentStack.screenMode, handleEditHit, handleSelectHit],
    );

    const unHit = useCallback(() => {
        console.log('[unHit]: Called.');
        setCurrentTarget(undefined);
    }, []);

    const setSelectedArtItem = useCallback(
        (item: GridItem | undefined) => {
            console.log(`[setSelectedArtItem]: Called wit item:`);
            console.dir(item);

            if (!item || !item.id) {
                setPendingSelection(undefined);
                unHit();
                return;
            }
            console.log(`[setSelectedArtItem]: Called with status:`);

            console.dir('item:');
            console.dir(item);
            console.dir('pendingSelection:');
            console.dir(pendingSelection);
            if (!gCtxt.currentArtCatalog)
                throw new Error('[setSelectedArtItem]: Catalog not loaded yet');
            if (!gCtxt.currentArtCatalog.items[item.id])
                throw new Error(
                    '[setSelectedArtItem]: Selected ArtItem not found in current catalog',
                );
            if (
                pendingSelection &&
                pendingSelection.hit.blockKind === 'gallery' &&
                pendingSelection.hit.kind === 'image' &&
                pendingSelection.block.blockKind === 'gallery'
            ) {
                console.log(`[setSelectedArtItem]: All conditions met`);
                const next: GalleryBlockItem = {
                    artId: item.id,
                    position: pendingSelection.hit.slot,
                    caption: { en: '' },
                };
                const idx = pendingSelection.block.items.findIndex(
                    (it) => it.position === next.position,
                );
                let nextItems = [];
                console.log(`[setSelectedArtItem]: Selected blockItem found with index ${idx}`);

                // If block item with pos not found ?????
                if (idx === -1) {
                    nextItems = [...pendingSelection.block.items, next];
                } else {
                    nextItems = pendingSelection.block.items.map((it, i) =>
                        i === idx ? next : it,
                    );
                }
                const nextBlock = { ...pendingSelection.block, items: nextItems };

                setValues(normalizeBlock(nextBlock));
                console.log(`[setSelectedArtItem]: Updated block set to:`);
                console.dir(nextBlock);
                pushMode('edit');
                setPendingSelection(undefined);
                unHit();
            } else {
                throw new Error(`[pendingSelected]: Received data doesn't match expected`);
            }
        },
        [pendingSelection, gCtxt.currentArtCatalog, unHit],
    );

    const onDelete = useCallback(() => {
        console.log(`onDelete called for block ${selectedBlock}`);
    }, [selectedBlock]);

    useEffect(() => {
        console.log(`[onHit]: currentTarget set to: ${currentTarget}`);
        console.dir(currentTarget);
    }, [currentTarget]);
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
        setValues((prev) => {
            if (!prev) return prev;
            return { ...prev, tags: uniq };
        });
    }, []);

    const value: BlockEditorSession = useMemo(
        () => ({
            selectedBlock,
            mode,
            values,
            collection,
            setValues,
            setMode,
            currentStack,
            setCollection,
            setSelectedArtItem,
            editorIsReady,
            isDirty,
            isValid,
            canSave,
            loading,
            saving,
            uiError,
            save,
            exit,
            onHit,
            unHit,
            onDelete,
            updateTags,
            isEditingTarget,
        }),
        [
            selectedBlock,
            mode,
            values,
            collection,
            editorIsReady,
            isDirty,
            isValid,
            canSave,
            loading,
            saving,
            uiError,
            setCollection,
            setSelectedArtItem,
            currentStack,
            save,
            exit,
            onHit,
            unHit,
            onDelete,
            updateTags,
            isEditingTarget,
        ],
    );

    return <BlockEditorCtx.Provider value={value}>{children}</BlockEditorCtx.Provider>;
}
