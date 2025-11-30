// EditorWorkspaceContext.tsx
import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export interface BlockRef {
    collectionId: string;
    blockId: string;
}

// Narrow global editor session state
export interface EditorWorkspaceState {
    currentStreamId?: string;
    currentBlocksCollectionId?: string; // "which collection is open"
    currentBlockRef?: BlockRef; // "which block in which collection is selected"
    currentArtItemId?: string;
}

// Context value: state + simple setters
export interface EditorWorkspaceContextValue extends EditorWorkspaceState {
    setStream(id?: string): void;
    setBlocksCollection(id?: string): void;
    setBlock(ref?: BlockRef): void;
    setArtItem(id?: string): void;
    reset(): void;
}

const EditorWorkspaceContext = createContext<EditorWorkspaceContextValue | undefined>(undefined);

interface EditorWorkspaceProviderProps {
    children: ReactNode;
}

export function EditorWorkspaceProvider({ children }: EditorWorkspaceProviderProps) {
    const [state, setState] = useState<EditorWorkspaceState>({
        currentStreamId: undefined,
        currentBlocksCollectionId: undefined,
        currentBlockRef: undefined,
        currentArtItemId: undefined,
    });

    const value = useMemo<EditorWorkspaceContextValue>(
        () => ({
            ...state,

            // Set current stream (optionally you may want to reset children)
            setStream(id) {
                setState((prev) => ({
                    ...prev,
                    currentStreamId: id,
                    // Optionally reset lower-level context:
                    // currentBlocksCollectionId: undefined,
                    // currentBlockRef: undefined,
                    // currentArtItemId: undefined,
                }));
            },

            // Open a blocks collection, clear selected block because it may be invalid now
            setBlocksCollection(id) {
                setState((prev) => ({
                    ...prev,
                    currentBlocksCollectionId: id,
                    currentBlockRef: undefined, // block selection does not make sense if collection changed
                }));
            },

            // Set current block with an explicit collection reference
            setBlock(ref) {
                if (!ref) {
                    // Clear selection
                    setState((prev) => ({
                        ...prev,
                        currentBlockRef: undefined,
                    }));
                    return;
                }

                setState((prev) => ({
                    ...prev,
                    currentBlocksCollectionId: ref.collectionId, // keep workspace in sync
                    currentBlockRef: ref,
                }));
            },

            setArtItem(id) {
                setState((prev) => ({
                    ...prev,
                    currentArtItemId: id,
                }));
            },

            reset() {
                setState({
                    currentStreamId: undefined,
                    currentBlocksCollectionId: undefined,
                    currentBlockRef: undefined,
                    currentArtItemId: undefined,
                });
            },
        }),
        [state],
    );

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
