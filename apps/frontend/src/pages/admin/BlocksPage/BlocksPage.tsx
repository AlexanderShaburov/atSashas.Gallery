// pages/admin/BlocksPage.tsx
import { BlockEditor } from '@/features/admin/blocks/BlockEditor/BlockEditor';
import type { BlockEditorSession } from '@/features/admin/blocks/editorSession';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import type { EditorWorkspaceContextValue } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';

import { useEffect } from 'react';
import './BlocksPage.css';

export default function BlocksPage() {
    const gCtxt: EditorWorkspaceContextValue = useEditorWorkspace();
    const eCtxt: BlockEditorSession = useBlockEditorSession();

    useEffect(() => {
        if (gCtxt.currentBlockRef) {
            eCtxt.setMode('edit');
        } else {
            eCtxt.setMode('create');
        }
    }, [eCtxt, gCtxt.currentBlockRef]);

    return (
        <div className="blocks-page">
            <header className="block-page__header">
                <h1 className="blocks-page__title">Blocks</h1>

                <div className="blocks-page__mode-switch">
                    <button
                        type="button"
                        className={
                            'blocks-page__mode-btn' +
                            (eCtxt.mode === 'create' ? ' blocks-page__mode-btn--active' : '')
                        }
                        onClick={() => eCtxt.setMode('create')}
                    >
                        Create
                    </button>
                    <button
                        type="button"
                        className={
                            'blocks-page__mode-btn' +
                            (eCtxt.mode === 'edit' ? ' blocks-page__mode-btn--active' : '')
                        }
                        onClick={() => eCtxt.setMode('edit')}
                    >
                        Edit
                    </button>
                </div>
            </header>
            <BlockEditor />
        </div>
    );
}
