// EditorWorkspaceContext.tsx
import type { BlocksCollectionJSON } from '@/entities/block';
import { ArtCatalog } from '@/entities/catalog';

import { getCollection } from '@/features/admin/blocks/api/blocksApi';
import { getCatalog } from '@/features/admin/catalogEditor/api';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

// Narrow global editor session state
export interface EditorWorkspaceState {
    currentStreamId?: string;

    // Single blocks collection (no collectionId anymore)
    currentBlocksCollection?: BlocksCollectionJSON;

    // Selected block (no BlockRef anymore)
    currentBlockId?: string;

    currentArtItemId?: string;
    currentArtCatalog?: ArtCatalog;

    currentStack?: GlobalStack;
}

// Context value: state + simple setters
export interface EditorWorkspaceContextValue extends EditorWorkspaceState {
    setStream(id?: string): void;

    // Set/replace current blocks collection (or clear it)
    setBlocksCollection(collection?: BlocksCollectionJSON): void;

    // Select a block by id (or clear selection)
    setBlock(id?: string): void;

    setArtItem(id?: string): void;
    setArtCatalog(catalog: ArtCatalog): void;

    reset(): void;
}

const EditorWorkspaceContext = createContext<EditorWorkspaceContextValue | undefined>(undefined);

interface EditorWorkspaceProviderProps {
    children: ReactNode;
}

export function EditorWorkspaceProvider({ children }: EditorWorkspaceProviderProps) {
    const [state, setState] = useState<EditorWorkspaceState>({
        currentStreamId: undefined,
        currentBlocksCollection: undefined,
        currentBlockId: undefined,
        currentArtItemId: undefined,
        currentArtCatalog: undefined,
    });

    const value = useMemo<EditorWorkspaceContextValue>(
        () => ({
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

            setArtCatalog(catalog: ArtCatalog) {
                setState((prev) => ({
                    ...prev,
                    currentArtCatalog: catalog,
                }));
            },

            reset() {
                setState({
                    currentStreamId: undefined,
                    currentBlocksCollection: undefined,
                    currentBlockId: undefined,
                    currentArtItemId: undefined,
                    currentArtCatalog: undefined,
                });
            },
        }),
        [state],
    );

    // Download art catalog + blocks collection on provider mount
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [catalog, blocksCollection] = await Promise.all([
                    getCatalog(),
                    getCollection(),
                ]);

                if (cancelled) return;

                setState((prev) => ({
                    ...prev,
                    currentArtCatalog: catalog,
                    currentBlocksCollection: blocksCollection,
                }));
            } catch (error) {
                console.error('Failed to load workspace data in EditorWorkspaceProvider', error);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <EditorWorkspaceContext.Provider value={value}>{children}</EditorWorkspaceContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEditorWorkspace(): EditorWorkspaceContextValue {
    const ctx = useContext(EditorWorkspaceContext);
    if (!ctx) {
        throw new Error('useEditorWorkspace must be used within EditorWorkspaceProvider');
    }
    return ctx;
}
