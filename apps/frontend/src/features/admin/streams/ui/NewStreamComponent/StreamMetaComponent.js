import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { generateId } from '@/shared/lib/id/generateId';
import { useEffect, useMemo, useState } from 'react';
import './StreamMetaComponent.css';
export function StreamMetaComponent(props) {
    const [streamId, setStreamId] = useState(undefined);
    const [title, setTitle] = useState('');
    const [tagsText, setTagsText] = useState('');
    const [description, setDescription] = useState('');
    // hydrate when initial changes (important if loaded async)
    useEffect(() => {
        if (!props.initial)
            return;
        setStreamId(props.initial.streamId);
        setTitle(props.initial.title ?? '');
        setTagsText((props.initial.tags ?? []).join(', '));
        setDescription(props.initial.description ?? '');
    }, [props.initial]);
    const tags = useMemo(() => normalizeTags(tagsText), [tagsText]);
    const validation = useMemo(() => {
        const problems = [];
        const t = title.trim();
        if (!t)
            problems.push('title is required');
        if (description.length > 2000)
            problems.push('description is too long');
        return { ok: problems.length === 0, problems };
    }, [title, description]);
    const canSubmit = validation.ok && !props.isLoading;
    return (_jsxs("div", { className: "csc", children: [_jsxs("div", { className: "csc__header", children: [_jsx("h1", { className: "csc__title", children: props.headerText ?? 'Stream metadata' }), _jsxs("div", { className: "csc__actions", children: [_jsx("button", { onClick: props.onCancel, disabled: props.isLoading, children: "Cancel" }), _jsx("button", { onClick: () => props.onSubmit({
                                    streamId: streamId ? streamId : generateId('stream'),
                                    title: title.trim(),
                                    tags,
                                    description: description.trim() ? description.trim() : '',
                                }), disabled: !canSubmit, children: props.isLoading ? 'Saving…' : (props.submitText ?? 'Save') })] })] }), _jsxs("div", { className: "csc__form", children: [_jsxs("label", { className: "csc__field", children: [_jsx("div", { className: "csc__label", children: "title" }), _jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "My stream", disabled: props.isLoading })] }), _jsxs("label", { className: "csc__field", children: [_jsx("div", { className: "csc__label", children: "tags" }), _jsx("input", { value: tagsText, onChange: (e) => setTagsText(e.target.value), placeholder: "comma, separated, tags", disabled: props.isLoading }), tags.length > 0 && (_jsx("div", { className: "csc__chips", children: tags.map((t) => (_jsx("span", { className: "csc__chip", children: t }, t))) }))] }), _jsxs("label", { className: "csc__field", children: [_jsx("div", { className: "csc__label", children: "description" }), _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Optional...", rows: 4, disabled: props.isLoading })] }), !validation.ok && (_jsxs("div", { className: "csc__validation", children: [_jsx("div", { className: "csc__validationTitle", children: "Fix these issues:" }), _jsx("ul", { children: validation.problems.map((p) => (_jsx("li", { children: p }, p))) })] })), props.error && _jsx("div", { className: "csc__error", children: props.error })] })] }));
}
function normalizeTags(input) {
    const raw = input
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    const seen = new Set();
    const uniq = [];
    for (const t of raw) {
        const key = t.toLowerCase();
        if (seen.has(key))
            continue;
        seen.add(key);
        uniq.push(t);
    }
    return uniq;
}
