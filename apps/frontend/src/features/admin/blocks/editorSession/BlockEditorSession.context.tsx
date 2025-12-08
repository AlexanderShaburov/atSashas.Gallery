// src/features/admin/blocks/editorSession/BlockEditorSession.context.tsx

import type { Block, BlocksCollectionJSON, CollectionsList } from '@/entities/block';
import type { EditorWorkspaceContextValue } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import {
    createCollection,
    deleteCollection,
    getCollection,
    getCollectionsList,
} from '@/features/admin/blocks/api/blocksApi';
import type {
    BlockEditorMode,
    BlockEditorSession,
} from '@/features/admin/blocks/editorSession/blockEditorTypes';
import {
    blockToForm,
    type BlockFormValue,
} from '@/features/admin/blocks/editorSession/blockFormValueTypes';
import { BlockEditorCtx } from '@/features/admin/blocks/hooks/useBlocksEditor';
import { validateBlockForm } from '@/features/admin/blocks/utils';
import { deepEqual } from '@/features/admin/catalogEditor/utils/checkers';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type ProviderProps = { children: ReactNode };

export function BlockEditorSessionProvider({ children }: ProviderProps) {
    // Global context
    const gCtxt: EditorWorkspaceContextValue = useEditorWorkspace();

    // Core state
    // List of available collections:
    const [collectionsList, setCollectionsList] = useState<CollectionsList | undefined>(undefined);
    // Selected collection:
    const [collection, setCollection] = useState<BlocksCollectionJSON | undefined>(undefined);
    // Selected block
    const [identity, setIdentity] = useState<Block | undefined>(undefined);
    // Editor form values:
    const [values, setValues] = useState<BlockFormValue | undefined>(undefined);
    const [mode, setMode] = useState<BlockEditorMode>('create');
    // UI / derived state
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isValid, setIsValid] = useState(false);
    // editorIsReady is to identify if now a block is under editing!!!
    const [editorIsReady, setEditorIsReady] = useState(false);
    const [canSave, setCanSave] = useState(false);

    const snapshot = useRef<BlockFormValue | undefined>(undefined);
    const valuesRef = useRef<BlockFormValue | undefined>(values);

    // Block setter helper -> set both workspace and editor contexts
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const setBlockSelected = (id: string | undefined): boolean => {
        // Find block with id in current collection
        if (!id) {
            gCtxt.setBlock(undefined);
            setIdentity(undefined);
            return true;
        } else {
            if (collection) {
                const bl = collection?.blocks.find((block) => block.id === id);
                if (bl) {
                    gCtxt.setBlock({
                        collectionId: collection.collectionId,
                        blockId: id,
                    });
                    setIdentity(bl);
                    return true;
                } else {
                    console.error(
                        `Block with id: ${gCtxt.currentBlockRef} not found in collection ${collection?.collectionName}`,
                    );
                    return false;
                }
            }
            console.error(`Collection not set for block with id: ${id}`);
            return false;
        }
    };

    // ***** Collections preload *****
    const refreshBlocks = useCallback(async () => {
        try {
            setLoading(true);

            // Download and set collections list
            const list = await getCollectionsList();
            setCollectionsList(list);

            // Check if workspace has the collection selected
            let currentCollection: BlocksCollectionJSON | undefined = undefined;
            if (gCtxt.currentBlocksCollectionId) {
                currentCollection = await getCollection(gCtxt.currentBlocksCollectionId);
                setCollection(currentCollection);
            }
            console.log(`Collection list is: ${list}`);
            console.dir(list);
            return { list, currentCollection };
        } catch (e) {
            console.error('Failed to initiate block editor session', e);
            setCollectionsList([]);
            return { list: [], currentCollection: undefined };
        } finally {
            setLoading(false);
        }
    }, [gCtxt.currentBlocksCollectionId]);

    // initial load
    useEffect(() => {
        (async () => {
            await refreshBlocks();
        })();
    }, [refreshBlocks]);

    // keep ref in sync
    useEffect(() => {
        valuesRef.current = values;
    }, [values]);

    // recompute canSave
    useEffect(() => {
        setCanSave(!saving && isDirty && isValid);
    }, [saving, isDirty, isValid]);

    // Reset session helper
    const resetSession = () => {
        setIdentity(undefined);
        setValues(undefined);
        setEditorIsReady(false);
        snapshot.current = undefined;
        setIsDirty(false);
        setIsValid(false);
        setMode('create');
    };

    // ------------------------------------
    // *********** INIT SESSION ***********
    // ------------------------------------

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                console.log('[INIT SESSION]: started');

                // Check if workspace has collection selected
                const collectionId = gCtxt.currentBlocksCollectionId;
                const blockRef = gCtxt.currentBlockRef;

                // 1) If collection id not selected in workspace -> total reset
                if (!collectionId) {
                    setCollection(undefined);
                    resetSession();
                    setMode('create');
                    return;
                }

                // 2) If collection id saved -> load collection from backend
                const nextCollection = await getCollection(collectionId);
                setCollection(nextCollection);

                // 3) If in workspace not block selected -> open collection to create new block
                if (!blockRef) {
                    resetSession();
                    setMode('create');
                    return;
                }

                // 4) Check blockRef and collection compliance
                if (blockRef.collectionId !== collectionId) {
                    console.error('Workspace context error: collection and block mismatch');
                    console.error(`Block's collection id: ${blockRef.collectionId}`);
                    console.error(`Workspace collection id: ${collectionId}`);
                    setCollection(undefined);
                    resetSession();
                    return;
                }

                // 5) Find block in downloaded collection
                const bl = nextCollection?.blocks.find((block) => block.id === blockRef.blockId);

                if (!bl) {
                    console.error(
                        `Can't find block ${blockRef.blockId} in corresponding collection`,
                    );
                    resetSession();
                    return;
                }

                setIdentity(bl);
                setValues(blockToForm(bl));
                setMode('edit');
            } catch (e) {
                console.error(`Loading error ${e}`);
            } finally {
                setLoading(false);
            }
        })();
    }, [mode, gCtxt.currentBlocksCollectionId, gCtxt.currentBlockRef]);

    // dirty + validity tracking
    useEffect(() => {
        if (!valuesRef.current || !snapshot.current || !identity) {
            setIsDirty(false);
            setIsValid(false);
            return;
        }

        const dirty = !deepEqual(snapshot.current, valuesRef.current);
        setIsDirty(dirty);

        const valid = validateBlockForm(valuesRef.current);
        setIsValid(valid);
    }, [values, identity]);

    const save = useCallback(async () => {
        if (!values || !canSave) return;
        setSaving(true);
        try {
            // TODO: sanitize + build payload + update backend
            // await updateBlocksCatalog(...);

            await refreshBlocks();
            // reset baseline
            snapshot.current = values;
            setIsDirty(false);
        } catch (e) {
            console.error('Failed to save block:', e);
        } finally {
            setSaving(false);
        }
    }, [values, canSave, refreshBlocks]);

    const exit = useCallback(() => {
        if (saving) return;
        if (isDirty && !confirm('Discard unsaved block changes?')) return;
        refreshBlocks();
        setIdentity(undefined);
    }, [saving, isDirty, refreshBlocks]);

    // Add new collection handler
    const newCollection = useCallback(
        async (name: string) => {
            console.log(`NewCollection called wit "${name}" name`);
            await createCollection(name);

            const { list } = await refreshBlocks();
            console.dir(list);

            const ncListItem = list?.find((col) => col.name === name);

            if (ncListItem?.id) {
                const nc = await getCollection(ncListItem.id);
                setCollection(nc);
                console.log(`Current collection set to ${nc}`);
            } else {
                console.error(`Failed to add new collection with name: ${name}`);
            }
        },
        [refreshBlocks, setCollection],
    );

    const removeCollection = useCallback(async () => {
        if (!collection) return;
        setSaving(true);
        try {
            // TODO: sanitize + build payload + update backend
            // await updateBlocksCatalog(...);

            await deleteCollection(collection);
            // refresh Collection list
            setCollection(undefined);
            refreshBlocks();
        } catch (e) {
            console.error('Failed to delete collection', e);
        } finally {
            setSaving(false);
        }
    }, [setCollection, collection, setSaving, refreshBlocks]);

    const value: BlockEditorSession = useMemo(
        () => ({
            collectionsList,
            identity,
            mode,
            values,
            collection,
            setValues,
            setIdentity,
            setMode,
            setCollection,
            newCollection,
            removeCollection,
            editorIsReady,
            isDirty,
            isValid,
            canSave,
            loading,
            saving,
            save,
            exit,
        }),
        [
            collectionsList,
            identity,
            mode,
            values,
            collection,
            editorIsReady,
            isDirty,
            isValid,
            canSave,
            loading,
            saving,
            setCollection,
            newCollection,
            removeCollection,
            save,
            exit,
        ],
    );

    return <BlockEditorCtx.Provider value={value}>{children}</BlockEditorCtx.Provider>;
}
