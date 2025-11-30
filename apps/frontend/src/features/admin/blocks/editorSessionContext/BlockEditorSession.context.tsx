// src/features/admin/blocks/editorSession/BlockEditorSession.context.tsx

import type { Block, BlocksCollectionJSON, CollectionsList } from '@/entities/block';
import type { EditorWorkspaceContextValue } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import {
    createCollection,
    getCollection,
    getCollectionsList,
} from '@/features/admin/blocks/api/blocksApi';
import {
    blockToForm,
    type BlockFormValue,
} from '@/features/admin/blocks/editorSessionContext/blockFormValueTypes';
import { validateBlockForm } from '@/features/admin/blocks/utils';
import { deepEqual } from '@/features/admin/catalogEditor/utils/checkers';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import type { BlockEditorMode, BlockEditorSession } from './blockEditorTypes';

const BlockEditorCtx = createContext<BlockEditorSession | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useBlockEditorSession = () => {
    const v = useContext(BlockEditorCtx);
    if (!v) {
        throw new Error('useBlockEditorSession must be used within BlockEditorSessionProvider');
    }
    return v;
};

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
            setCollectionsList(await getCollectionsList());

            // Check if workspace has the collection selected
            if (gCtxt.currentBlocksCollectionId) {
                const cl = await getCollection(gCtxt.currentBlocksCollectionId);
                setCollection(cl);
            }
        } catch (e) {
            console.error('Failed to initiate block editor session', e);
            setCollectionsList([]);
        } finally {
            setLoading(false);
        }
        return collectionsList;
    }, [gCtxt]);

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
                // Check if workspace has collection selected
                if (gCtxt.currentBlocksCollectionId) {
                    setCollection(await getCollection(gCtxt.currentBlocksCollectionId));
                    // If collection selected, check block ref:
                    if (gCtxt.currentBlockRef) {
                        // Check if BlocRef collection id the same as collection set:
                        if (gCtxt.currentBlockRef.collectionId != collection?.collectionId) {
                            console.error(`Workspace context error: collection and block mismatch`);
                            console.error(
                                `Block's collection id: ${gCtxt.currentBlockRef.collectionId}`,
                            );
                            console.error(
                                ` while set workspace collection id: ${gCtxt.currentBlocksCollectionId}`,
                            );
                            setCollection(undefined);
                            resetSession();
                        } else {
                            // If everything ok, set block and identity:
                            const bl = collection.blocks.find(
                                (block) => block.id === gCtxt.currentBlockRef?.blockId,
                            );
                            if (bl) {
                                setIdentity(bl);
                                setValues(blockToForm(bl));
                                setMode('edit');
                            } else {
                                console.error(
                                    `Can't find block ${gCtxt.currentBlockRef.blockId} in corresponding collection`,
                                );
                                resetSession();
                            }
                        }
                    }
                } else {
                    setCollection(undefined);
                    resetSession();
                    setMode('create');
                }
            } catch (e) {
                console.error(`Loading error ${e}`);
            } finally {
                setLoading(false);
            }
        })();
    }, [collection, mode, gCtxt]);

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
    // Add new collection
    const newCollection = useCallback(
        async (name: string) => {
            await createCollection(name);

            const list = await refreshBlocks();

            const ncListItem = list?.find((coll) => coll.name === name);

            if (ncListItem?.id) {
                const nc = await getCollection(ncListItem.id);
                setCollection(nc);
            } else {
                console.error(`Failed to add new collection with name: ${name}`);
            }
        },
        [refreshBlocks, setCollection],
    );

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
            save,
            exit,
        ],
    );

    return <BlockEditorCtx.Provider value={value}>{children}</BlockEditorCtx.Provider>;
}
