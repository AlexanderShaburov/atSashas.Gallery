import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function BlockModeTag({ mode, dirty, valid, saving, hasIdentity }) {
    const modeLabel = mode === 'create' ? 'Create block' : 'Edit block';
    const statusParts = [];
    if (saving) {
        statusParts.push('saving…');
    }
    else if (dirty) {
        statusParts.push('unsaved changes');
    }
    else {
        statusParts.push('up to date');
    }
    if (!valid && dirty) {
        statusParts.push('invalid');
    }
    if (mode === 'edit' && !hasIdentity) {
        statusParts.push('no block selected');
    }
    const status = statusParts.join(' • ');
    return (_jsxs("div", { className: "block-mode-tag", children: [_jsx("span", { className: "block-mode-tag__mode", children: modeLabel }), _jsx("span", { className: "block-mode-tag__status", children: status })] }));
}
