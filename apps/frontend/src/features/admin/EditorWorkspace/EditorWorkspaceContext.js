import { jsx as _jsx } from "react/jsx-runtime";
import { getCollection } from '@/features/admin/blocks/api/blocksApi';
import { getCatalog } from '@/features/admin/catalogEditor/api';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
const EditorWorkspaceContext = createContext(undefined);
export function EditorWorkspaceProvider({ children }) {
    const [state, setState] = useState({
        currentStreamId: undefined,
        currentBlocksCollection: undefined,
        currentBlockId: undefined,
        currentArtItemId: undefined,
        currentArtCatalog: undefined,
    });
    const value = useMemo(() => ({
        ...state,
        setStream(id) {
            setState((prev) => ({
                ...prev,
                currentStreamId: id,
            }));
        },
        // Replace current blocks collection and clear selected block (selection may become invalid)
        setBlocksCollection(collection) {
            setState((prev) => ({
                ...prev,
                currentBlocksCollection: collection,
                currentBlockId: undefined,
            }));
        },
        setBlock(id) {
            setState((prev) => ({
                ...prev,
                currentBlockId: id,
            }));
        },
        setArtItem(id) {
            setState((prev) => ({
                ...prev,
                currentArtItemId: id,
            }));
        },
        setArtCatalog(catalog) {
            setState((prev) => ({
                ...prev,
                currentArtCatalog: catalog,
            }));
        },
        reset() {
            setState({
                currentStreamId: undefined,
                currentBlockId: undefined,
                currentArtItemId: undefined,
                currentArtCatalog: undefined,
            });
        },
    }), [state]);
    // Download art catalog + blocks collection on provider mount
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const [catalog, blocksCollection] = await Promise.all([
                    getCatalog(),
                    getCollection(),
                ]);
                if (cancelled)
                    return;
                setState((prev) => ({
                    ...prev,
                    currentArtCatalog: catalog,
                    currentBlocksCollection: blocksCollection,
                }));
            }
            catch (error) {
                console.error('Failed to load workspace data in EditorWorkspaceProvider', error);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);
    return (_jsx(EditorWorkspaceContext.Provider, { value: value, children: children }));
}
// eslint-disable-next-line react-refresh/only-export-components
export function useEditorWorkspace() {
    const ctx = useContext(EditorWorkspaceContext);
    if (!ctx) {
        throw new Error('useEditorWorkspace must be used within EditorWorkspaceProvider');
    }
    return ctx;
}
