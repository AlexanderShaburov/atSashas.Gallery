// pages/admin/BlocksPage.tsx
import { BlockEditor } from '@/features/admin/blocks/BlockEditorScreen/BlockEditorScreen';
import type { BlockEditorSession } from '@/features/admin/blocks/editorSession';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import type { EditorWorkspaceContextValue } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';

import { useEffect } from 'react';
import './block-cta.core.css';
import './block-gallery.core.css';
import './block-text.core.css';
import './BlocksPage.css';

export default function BlocksPage() {
    const gCtxt: EditorWorkspaceContextValue = useEditorWorkspace();
    const eCtxt: BlockEditorSession = useBlockEditorSession();

    useEffect(() => {
        if (gCtxt.currentBlockId) {
            eCtxt.setMode('edit');
        } else {
            eCtxt.setMode('create');
        }
    }, [eCtxt, gCtxt.currentBlockId]);

    return (
        <div className="blocks-page">
            <header className="block-page__header">
                <h1 className="blocks-page__title">Blocks</h1>
            </header>
            <BlockEditor />
        </div>
    );
}
