import { createContext, useContext } from 'react';
export const StreamEditorCtx = createContext(undefined);
export const useStreamEditorSession = () => {
    const v = useContext(StreamEditorCtx);
    if (!v) {
        throw new Error('useStreamEditorSession must be used within StreamEditorSessionProvider');
    }
    return v;
};
