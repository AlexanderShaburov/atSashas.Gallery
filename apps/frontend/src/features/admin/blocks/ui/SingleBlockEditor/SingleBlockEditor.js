import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CtaBlockComponent, GalleryComponent, TextBlockComponent, } from '@/features/admin/shared/ui/BlockPreview';
import { SingleEditorToolbar } from '@/shared/ui/SingleEditorToolbar/SingleEditorToolbar';
import './SingleBlockEditor.css';
export function SingleBlockEditor({ item, onHit, setValue, toolbarProps }) {
    let content = undefined;
    const { isJourney, ...tbCtx } = toolbarProps;
    if (isJourney) {
        console.log(`[SingleBlockEditor]: We are in journey now, baby`);
    }
    else {
        console.log(`[SingleBlockEditor]: Oups! We got lost our ticket, baby`);
    }
    const tbContent = isJourney
        ? ['delete', 'tags', 'exit', 'apply', 'save']
        : ['delete', 'tags', 'exit', 'save'];
    switch (item.blockKind) {
        case 'gallery':
            content = (_jsx(GalleryComponent, { item: item, onHit: onHit, parent: "editor", setValue: setValue }));
            break;
        case 'cta':
            content = (_jsx(CtaBlockComponent, { item: item, onHit: onHit, parent: "editor", setValue: setValue }));
            break;
        case 'text':
            content = (_jsx(TextBlockComponent, { item: item, onHit: onHit, parent: "editor", setValue: setValue }));
            break;
        default:
            content = undefined;
    }
    return (_jsxs("div", { className: "sbe-main", children: [_jsx("div", { className: "sbe-frame", children: _jsx("div", { className: "sbe-canvas", children: content }) }), _jsx(SingleEditorToolbar, { tools: tbContent, ctx: tbCtx })] }));
}
