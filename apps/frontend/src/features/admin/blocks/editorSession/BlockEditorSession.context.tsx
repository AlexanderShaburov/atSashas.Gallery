// src/features/admin/blocks/editorSession/BlockEditorSession.context.tsx

import type {
    Block,
    BlockEditorMode,
    BlockEditorScreenMode,
    BlocksCollectionJSON,
} from '@/entities/block';
import type { UiErrorState } from '@/entities/common';
import type { EditorWorkspaceContextValue } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { getCollection } from '@/features/admin/blocks/api/blocksApi';
import { blockToForm, type BlockFormValue } from '@/features/admin/blocks/editorSession';
import type { BlockEditorSession } from '@/features/admin/blocks/editorSession/blockEditorTypes';
import { BlockEditorCtx } from '@/features/admin/blocks/hooks/useBlocksEditor';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
import { validateBlockForm } from '@/features/admin/blocks/utils';
import { deepEqual } from '@/features/admin/catalogEditor/utils/checkers';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type ProviderProps = { children: ReactNode };

export function BlockEditorSessionProvider({ children }: ProviderProps) {
    // Global context
    const gCtxt: EditorWorkspaceContextValue = useEditorWorkspace();
    //*******************************************************/
    // Core state:
    // Editor mode
    const [mode, setMode] = useState<BlockEditorMode>('create');
    // Blocks collection
    const [collection, setCollection] = useState<BlocksCollectionJSON | undefined>(undefined);
    // Selected block
    const [selectedBlock, setSelectedBlock] = useState<Block | undefined>(undefined);
    // Editor form values:
    const [values, setValues] = useState<BlockFormValue | undefined>(undefined);
    // Editor mode:
    const [screenMode, setScreenMode] = useState<BlockEditorScreenMode>('select');

    //*******************************************************/
    // UI / derived state
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isValid, setIsValid] = useState(false);
    // editorIsReady is to identify if now a block is under editing!!!
    const [editorIsReady, setEditorIsReady] = useState(false);
    const [canSave, setCanSave] = useState(false);

    const [uiError, setUiError] = useState<UiErrorState | undefined>(undefined);

    const snapshot = useRef<BlockFormValue | undefined>(undefined);
    const valuesRef = useRef<BlockFormValue | undefined>(values);
    //*******************************************************/

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
    }, []);

    // initial load
    useEffect(() => {
        (async () => {
            await refreshCollection();
        })();
    }, [refreshCollection]);

    // keep ref in sync
    useEffect(() => {
        valuesRef.current = values;
    }, [values]);

    // recompute canSave
    useEffect(() => {
        console.log('CanSave changed.');
        setCanSave(!saving && isDirty && isValid);
    }, [saving, isDirty, isValid]);

    // Reset session helper
    const resetSession = useCallback(() => {
        setSelectedBlock(undefined);
        setValues(undefined);
        setEditorIsReady(false);
        snapshot.current = undefined;
        setIsDirty(false);
        setIsValid(false);
        setMode('create');
        setScreenMode('select');
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

                // Check if workspace has block id selected
                // If not reset Editor session to initial empty values
                if (!gCtxt.currentBlockId) {
                    resetSession();
                    return;
                }

                // If block id selected -> find block in collection and set its data to form values
                const bl = cl.blocks.find((block) => block.id === gCtxt.currentBlockId);

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
                setValues(blockToForm(bl));
                setMode('edit');
            } catch (e) {
                console.error(`BlockEditorSession error: ${e}`);
            } finally {
                setLoading(false);
            }
        })();
    }, [refreshCollection]);

    // dirty + validity tracking
    useEffect(() => {
        if (!valuesRef.current || !snapshot.current || !selectedBlock) {
            setIsDirty(false);
            setIsValid(false);
            return;
        }

        const dirty = !deepEqual(snapshot.current, valuesRef.current);
        setIsDirty(dirty);

        const valid = validateBlockForm(valuesRef.current);
        setIsValid(valid);
    }, [values, selectedBlock]);

    const save = useCallback(async () => {
        if (!values || !canSave) return;
        setSaving(true);
        try {
            // TODO: sanitize + build payload + update backend
            // await updateBlocksCatalog(...);

            await refreshCollection();
            // reset baseline
            snapshot.current = values;
            setIsDirty(false);
        } catch (e) {
            console.error('Failed to save block:', e);
        } finally {
            setSaving(false);
        }
    }, [values, canSave, refreshCollection]);

    const exit = useCallback(() => {
        if (saving) return;
        if (isDirty && !confirm('Discard unsaved block changes?')) return;
        resetSession();
    }, [saving, isDirty, resetSession]);

    const onHit = useCallback(
        (hit: BlockHitEvent) => {
            console.log(`[onHit]: edit mode hit detected`);
            console.dir(hit);

            if (screenMode === 'select') handleSelectHit(hit);
            else handleEditHit(hit);
        },
        [screenMode],
    );

    const onDelete = useCallback(() => {
        console.log(`onDelete called for block ${selectedBlock}`);
    }, [selectedBlock]);

    function handleSelectHit(hit: BlockHitEvent) {
        setSelectedBlock(hit.block);
        setValues(blockToForm(hit.block));
        setScreenMode('edit');
    }

    function handleEditHit(hit: BlockHitEvent) {
        console.log(`[onHit]: edit mode hit detected`);
        console.dir(hit);
    }

    const value: BlockEditorSession = useMemo(
        () => ({
            selectedBlock,
            mode,
            values,
            collection,
            screenMode,
            setValues,
            setSelectedBlock,
            setMode,
            setScreenMode,
            setCollection,
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
            onDelete,
        }),
        [
            selectedBlock,
            mode,
            values,
            collection,
            screenMode,
            editorIsReady,
            isDirty,
            isValid,
            canSave,
            loading,
            saving,
            uiError,
            setCollection,
            setScreenMode,
            save,
            exit,
            onHit,
            onDelete,
        ],
    );

    return <BlockEditorCtx.Provider value={value}>{children}</BlockEditorCtx.Provider>;
}
