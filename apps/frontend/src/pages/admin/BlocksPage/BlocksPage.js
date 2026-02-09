import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { className: "blocks-page", children: [_jsx("header", { className: "block-page__header", children: _jsx("h1", { className: "blocks-page__title", children: "Blocks" }) }), _jsx(BlockEditor, {})] }));
}
