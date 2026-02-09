import { createContext, useContext } from 'react';
import { BlockEditorSession } from '@/features/admin/blocks/blockEditorSession';

export const BlockEditorCtx = createContext<BlockEditorSession | undefined>(undefined);

export const useBlockEditorSession = () => {
    const v = useContext(BlockEditorCtx);
    if (!v) {
        throw new Error('useBlockEditorSession must be used within BlockEditorSessionProvider');
    }
    return v;
};
