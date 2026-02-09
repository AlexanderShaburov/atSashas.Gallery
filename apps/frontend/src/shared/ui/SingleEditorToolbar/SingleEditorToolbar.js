import { jsx as _jsx } from "react/jsx-runtime";
// src/shared/ui/SingleEditorToolbar/SingleEditorToolbar.tsx
import './SingleEditorToolbar.css';
import { TOOL_REGISTRY } from './single-editor-toolbar.constants';
export function SingleEditorToolbar(props) {
    const ctx = props.ctx;
    const len = props.tools.length;
    const getPos = (index, len) => {
        if (index === 0)
            return 'set-actions--left';
        if (index >= len - 3)
            return 'set-actions--right';
        return 'set-tags';
    };
    return (_jsx("div", { className: "set-wrap", children: props.tools.map((e, index) => {
            const renderer = TOOL_REGISTRY[e];
            if (typeof renderer !== 'function') {
                return null;
            }
            return (_jsx("span", { className: getPos(index, len), children: renderer(ctx) }, index));
        }) }));
}
