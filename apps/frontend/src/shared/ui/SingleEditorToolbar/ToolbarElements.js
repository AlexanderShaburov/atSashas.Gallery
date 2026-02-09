import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// src/shared/ui/SingleEditorToolbar/ToolbarElements.tsx
import { useState } from 'react';
export function AddBlockButton({ onClick }) {
    return (_jsx("div", { className: "set-actions", children: _jsx("button", { type: "button", className: "set-btn", onClick: onClick, children: "Add" }) }));
}
export function EditMetadata({ onEdit }) {
    return (_jsx("div", { className: "set-actions", children: _jsx("button", { type: "button", className: "set-btn", onClick: onEdit, children: "Edit Meta" }) }));
}
export function ApplyButton({ onApply }) {
    return (_jsx("div", { className: "set-actions", children: _jsx("button", { type: "button", className: "set-btn", onClick: onApply, children: "Apply" }) }));
}
export function DeleteButton({ onDelete }) {
    return (_jsx(_Fragment, { children: _jsx("div", { className: "set-actions set-actions--left", children: _jsx("button", { type: "button", className: "set-btn set-btn--danger", onClick: onDelete, children: "\uD83D\uDDD1 Delete" }) }) }));
}
export function ExitButton({ onExit }) {
    return (_jsx("button", { type: "button", className: "set-btn set-btn--secondary", onClick: onExit, children: "\u2716 Exit" }));
}
export function SaveButton({ onClick, canSave, saving, }) {
    return (_jsx("button", { type: "button", className: "set-btn set-btn--primary", disabled: !canSave, onClick: () => !saving && canSave && onClick(), title: saving ? 'Saving...' : 'Save', children: !saving ? '💾 Save' : 'Saving…' }));
}
export function TagsEditor({ onCommit, tags, }) {
    const trueTags = tags ? tags : [];
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(trueTags.join(', '));
    const hasTags = trueTags.length > 0;
    function startEdit() {
        if (!onCommit)
            return;
        setDraft(trueTags.join(', '));
        setEditing(true);
    }
    function commit() {
        if (!onCommit)
            return;
        const next = draft
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        onCommit(next);
        setEditing(false);
    }
    function cancel() {
        setDraft(trueTags.join(', '));
        setEditing(false);
    }
    function onKeyDown(e) {
        if (e.key === 'Enter')
            commit();
        if (e.key === 'Escape')
            cancel();
    }
    return (_jsx(_Fragment, { children: _jsx("div", { className: "set-tags", children: !editing ? (_jsxs("div", { className: `set-tags__view ${!hasTags ? 'is-empty' : ''}`, role: "button", onClick: startEdit, children: [_jsx("span", { className: "set-tags__label", children: "Tags:" }), _jsx("span", { className: "set-tags__value", children: hasTags ? trueTags.join(', ') : 'Add tags…' })] })) : (_jsx("input", { className: "set-tags__input", autoFocus: true, value: draft, onChange: (e) => setDraft(e.target.value), onKeyDown: onKeyDown, onBlur: commit, placeholder: "tag1, tag2, tag3" })) }) }));
}
