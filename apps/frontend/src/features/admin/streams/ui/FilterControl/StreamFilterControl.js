import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import './StreamFilterControl.css';
const STREAM_STATUSES = ['draft', 'ready', 'archived'];
export function StreamFilterControl({ filter, updateFilter, streams }) {
    const { query, tags, status, extended, updatedAfter, updatedBefore } = filter;
    const [tagDraft, setTagDraft] = useState('');
    const tagsListId = 'sfc-tags';
    const statusListId = 'sfc-status';
    const tagsList = useMemo(() => {
        const set = new Set();
        (streams ?? []).forEach((s) => {
            (s.tags ?? []).forEach((t) => {
                if (t)
                    set.add(t);
            });
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [streams]);
    const commitTag = (v) => {
        const t = v.trim();
        if (!t)
            return;
        if (tags.includes(t))
            return;
        updateFilter({ tags: [...tags, t] });
        setTagDraft('');
    };
    const removeTag = (t) => {
        updateFilter({ tags: tags.filter((x) => x !== t) });
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "stream-filter__basic", children: [_jsx("input", { className: "stream-filter__input", value: query, onChange: (e) => updateFilter({ query: e.target.value }), placeholder: "Search streams\u2026" }), _jsx("input", { list: tagsListId, className: "stream-filter__input", value: tagDraft, onChange: (e) => setTagDraft(e.target.value), onBlur: () => commitTag(tagDraft), onKeyDown: (e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                commitTag(tagDraft);
                            }
                        }, placeholder: "Add tag\u2026" }), _jsx("datalist", { id: tagsListId, children: tagsList.map((t) => (_jsx("option", { value: t }, t))) }), _jsxs("div", { className: "stream-filter__mode-selector", children: [_jsx("div", { className: "stream-filter__mode", children: _jsx("button", { type: "button", className: !extended ? 'active' : '', onClick: () => updateFilter({ extended: false }), children: "Basic" }) }), _jsx("div", { className: "stream-filter__mode", children: _jsx("button", { type: "button", className: extended ? 'active' : '', onClick: () => updateFilter({ extended: true }), children: "Advanced" }) })] })] }), tags.length > 0 && (_jsxs("div", { className: "stream-filter__chips", children: [tags.map((t) => (_jsxs("button", { type: "button", className: "stream-filter__chip", onClick: () => removeTag(t), title: "Remove tag", children: [t, " \u2715"] }, t))), _jsx("button", { type: "button", className: "stream-filter__chip stream-filter__chip--clear", onClick: () => updateFilter({ tags: [] }), children: "Clear tags" })] })), extended && (_jsxs("div", { className: "stream-filter__advanced", children: [_jsx("input", { list: statusListId, className: "stream-filter__input", value: status ?? '', onChange: (e) => updateFilter({
                            status: e.target.value === ''
                                ? undefined
                                : e.target.value,
                        }), placeholder: "Status" }), _jsx("datalist", { id: statusListId, children: STREAM_STATUSES.map((s) => (_jsx("option", { value: s }, s))) }), _jsx("input", { type: "date", className: "stream-filter__input", value: updatedAfter ?? '', onChange: (e) => updateFilter({ updatedAfter: e.target.value || undefined }), placeholder: "Updated after" }), _jsx("input", { type: "date", className: "stream-filter__input", value: updatedBefore ?? '', onChange: (e) => updateFilter({ updatedBefore: e.target.value || undefined }), placeholder: "Updated before" })] }))] }));
}
