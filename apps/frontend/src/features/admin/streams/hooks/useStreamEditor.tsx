import { StreamEditorSession } from '@/features/admin/streams/streamEditorSession/stream-editor-session.types';
import { createContext, useContext } from 'react';

export const StreamEditorCtx = createContext<StreamEditorSession | undefined>(undefined);

export const useStreamEditorSession = () => {
    const v = useContext(StreamEditorCtx);
    if (!v) {
        throw new Error('useStreamEditorSession must be used within StreamEditorSessionProvider');
    }
    return v;
};
