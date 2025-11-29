// src/features/admin/blocks/editorSession/BlockEditorSession.context.tsx

import { Block, BlocksCollectionJSON, CollectionsList } from '@/entities/block';
import type { EditorWorkspaceContextValue } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { getCollection, getCollectionsList } from '@/features/admin/blocks/api/blocksApi';
import { blockToForm } from '@/features/admin/blocks/editorSessionContext/blockFormValueTypes';
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
import type { BlockEditorMode, BlockEditorSession, BlockFormValue } from './blockEditorTypes';
// TODO: import { getBlocks, updateBlocksCatalog } from '../api/blocksApi';

const BlockEditorCtx = createContext<BlockEditorSession | undefined>(undefined);

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
    const global: EditorWorkspaceContextValue = useBlockEditorSession();

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

    const refreshBlocks = useCallback(async () => {
        try {
            setLoading(true);
            // Download collections list
            const l = await getCollectionsList();
            setCollectionsList(l);

            // Check if user has the collection selected
            if (global.currentBlocksCollectionId) {
                const cl = await getCollection(global.currentBlocksCollectionId);
                setCollection(cl);
            }
            // Check if we got and collection and block id selected already
            if (global.currentBlocksCollectionId && global.currentBlockId) {
                const bl = collection?.blocks.find((b) => b.id === global.currentBlockId);
                if (bl) {
                    setIdentity(bl);
                    setValues(blockToForm(bl));
                    setMode('edit');
                }
            } else {
                // If global stake has no information concerning that session set session as new:
            }
        } catch (e) {
            console.error('Failed to initiate block editor session', e);
        } finally {
            setLoading(false);
        }
    }, [collection, global]);

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

    // identity → init session
    useEffect(() => {
        if (!identity) {
            setValues(undefined);
            setEditorIsReady(false);
            snapshot.current = undefined;
            setIsDirty(false);
            setIsValid(false);
            return;
        }

        let initial: BlockFormValue;

        if (identity.mode === 'create') {
            initial = {
                mode: 'create', // if you add mode inside formValue
                kind: 'gallery', // default kind, adjust later
                tags: [],
            } as BlockFormValue;
        } else {
            const b = identity.block;
            initial = {
                id: b.id,
                kind: b.kind,
                layout: b.layout,
                tags: b.tags,
                dateCreated: b.dateCreated,
            };
        }

        valuesRef.current = initial;
        snapshot.current = initial;
        setValues(initial);
        setIsDirty(false);
        setIsValid(true); // or run validation here
        setEditorIsReady(true);
        setMode(identity.mode);
    }, [identity]);

    // dirty + validity tracking
    useEffect(() => {
        if (!valuesRef.current || !snapshot.current || !identity) {
            setIsDirty(false);
            setIsValid(false);
            return;
        }

        // TODO: deepEqual / validateBlockForm
        const dirty = JSON.stringify(valuesRef.current) !== JSON.stringify(snapshot.current);
        setIsDirty(dirty);

        const valid = !!valuesRef.current.kind && !!valuesRef.current.layout;
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

    const value: BlockEditorSession = useMemo(
        () => ({
            blocks,
            identity,
            mode,
            values,
            setValues,
            setIdentity,
            setMode,
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
            blocks,
            identity,
            mode,
            values,
            editorIsReady,
            isDirty,
            isValid,
            canSave,
            loading,
            saving,
            save,
            exit,
        ],
    );

    return <BlockEditorCtx.Provider value={value}>{children}</BlockEditorCtx.Provider>;
}
