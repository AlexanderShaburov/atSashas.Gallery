// EditorWorkspaceContext.tsx
import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

// Narrow global editor session state
export interface EditorWorkspaceState {
    currentStreamId?: string | undefined;
    currentBlocksCollectionId?: string | undefined;
    currentBlockId?: string | undefined;
    currentArtItemId?: string | undefined;
}

// Context value: state + simple setters
export interface EditorWorkspaceContextValue extends EditorWorkspaceState {
    setStream(id?: string): void;
    setBlocksCollection(id?: string): void;
    setBlock(id?: string): void;
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
        currentBlockId: undefined,
        currentArtItemId: undefined,
    });

    const value = useMemo<EditorWorkspaceContextValue>(
        () => ({
            ...state,

            // Set current stream and optionally reset dependent fields
            setStream(id) {
                setState((prev) => ({
                    ...prev,
                    currentStreamId: id,
                    // You can also reset nested context when stream changes:
                    // currentBlocksCollectionId: undefined,
                    // currentBlockId: undefined,
                    // currentArtItemId: undefined,
                }));
            },

            setBlocksCollection(id) {
                setState((prev) => ({
                    ...prev,
                    currentBlocksCollectionId: id,
                    // Optionally reset lower levels:
                    // currentBlockId: undefined,
                    // currentArtItemId: undefined,
                }));
            },

            setBlock(id) {
                setState((prev) => ({
                    ...prev,
                    currentBlockId: id,
                    // Optionally reset art item:
                    // currentArtItemId: undefined,
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
                    currentBlockId: undefined,
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
        // This helps to catch usage outside of provider at development time
        throw new Error('useEditorWorkspace must be used within EditorWorkspaceProvider');
    }
    return ctx;
}
