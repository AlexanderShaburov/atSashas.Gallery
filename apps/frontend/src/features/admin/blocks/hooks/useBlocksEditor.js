import { createContext, useContext } from 'react';
export const BlockEditorCtx = createContext(undefined);
export const useBlockEditorSession = () => {
    const v = useContext(BlockEditorCtx);
    if (!v) {
        throw new Error('useBlockEditorSession must be used within BlockEditorSessionProvider');
    }
    return v;
};
