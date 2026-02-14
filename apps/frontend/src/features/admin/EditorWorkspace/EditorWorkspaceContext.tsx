// EditorWorkspaceContext.tsx
import type { BlocksCollectionJSON } from '@/entities/block';
import { ArtCatalog } from '@/entities/catalog';
import type { StreamIndexItem } from '@/entities/stream';

import { getCollection } from '@/features/admin/blocks/api/blocksApi';
import { getCatalog } from '@/features/admin/catalogEditor/api';
import { streamsApi } from '@/features/admin/streams/api/streamsApi';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Narrow global editor session state
export interface EditorWorkspaceState {
    currentStreamId?: string;

    // Single blocks collection (no collectionId anymore)
    currentBlocksCollection?: BlocksCollectionJSON;

    // Selected block (no BlockRef anymore)
    currentBlockId?: string;

    currentArtItemId?: string;
    currentArtCatalog?: ArtCatalog;

    // NEW: Streams index for dependency tracking
    streamsIndex: StreamIndexItem[] | null;
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

    // NEW: Refresh methods for dependency-aware deletion
    refreshCatalog(): Promise<void>;
    refreshBlocks(): Promise<void>;
    refreshStreams(): Promise<void>;
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
        streamsIndex: null,
    });

    // Refresh methods
    const refreshCatalog = useCallback(async () => {
        try {
            const catalog = await getCatalog();
            setState((prev) => ({ ...prev, currentArtCatalog: catalog }));
        } catch (error) {
            console.error('Failed to refresh catalog:', error);
        }
    }, []);

    const refreshBlocks = useCallback(async () => {
        try {
            const collection = await getCollection();
            setState((prev) => ({ ...prev, currentBlocksCollection: collection }));
        } catch (error) {
            console.error('Failed to refresh blocks:', error);
        }
    }, []);

    const refreshStreams = useCallback(async () => {
        try {
            const index = await streamsApi.list();
            setState((prev) => ({ ...prev, streamsIndex: index }));
        } catch (error) {
            console.error('Failed to refresh streams:', error);
        }
    }, []);

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
                    currentBlockId: undefined,
                    currentArtItemId: undefined,
                    currentArtCatalog: undefined,
                    streamsIndex: null,
                });
            },

            refreshCatalog,
            refreshBlocks,
            refreshStreams,
        }),
        [state, refreshCatalog, refreshBlocks, refreshStreams],
    );

    // Download art catalog + blocks collection + streams index on provider mount
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [catalog, blocksCollection, streamsIndex] = await Promise.all([
                    getCatalog(),
                    getCollection(),
                    streamsApi.list(),
                ]);

                if (cancelled) return;

                setState((prev) => ({
                    ...prev,
                    currentArtCatalog: catalog,
                    currentBlocksCollection: blocksCollection,
                    streamsIndex,
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
