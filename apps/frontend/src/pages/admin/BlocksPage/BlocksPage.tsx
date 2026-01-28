// pages/admin/BlocksPage.tsx
import { BlockEditor } from '@/features/admin/blocks/BlockEditorScreen/BlockEditorScreen';

import './block-cta.core.css';
import './block-gallery.core.css';
import './block-text.core.css';
import './BlocksPage.css';

export default function BlocksPage() {
    // useEffect(() => {
    //     if (gCtxt.currentBlockId) {
    //         eCtxt.setMode('edit');
    //     } else {
    //         eCtxt.setMode('create');
    //     }
    // }, [eCtxt, gCtxt.currentBlockId]);

    return (
        <div className="blocks-page">
            <header className="block-page__header">
                <h1 className="blocks-page__title">Blocks</h1>
            </header>
            <BlockEditor />
        </div>
    );
}
