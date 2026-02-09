import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
//src/features/admin/blocks/ui/FilterControl/FilterControl.tsx:
import { BLOCK_KINDS, CTA_TYPES, GALLERY_LAYOUTS, } from '@/entities/block/block.types';
import { useBlockEditorSession } from '@/features/admin/blocks//hooks/useBlocksEditor';
import { useEffect, useState } from 'react';
import './FilterControl.css';
export function FilterControl({ filter, updateFilter }) {
    const ctx = useBlockEditorSession();
    const { kind, layout, ctaType, artName, extended } = filter;
    const [tagDraft, setTagDraft] = useState('');
    const [tagsList, setTagsList] = useState([]);
    const tagsListId = 'fc-tags';
    const kindListId = 'fc-block-kind';
    useEffect(() => {
        if (!ctx.collection)
            return;
        const tags = [];
        Object.values(ctx.collection.blocks).forEach((b) => {
            b.tags?.forEach((t) => {
                if (!tags.includes(t)) {
                    tags.push(t);
                }
            });
        });
        setTagsList(tags);
    }, [ctx.collection]);
    const commitTag = (v) => {
        const t = v.trim();
        if (!t)
            return;
        if (filter.tags.includes(t))
            return;
        updateFilter({ tags: [...filter.tags, t] });
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "filter-control__basic", children: [_jsx("input", { list: tagsListId, className: "filter-control__input", value: tagDraft ?? '', onChange: (e) => setTagDraft(e.target.value), onBlur: () => commitTag(tagDraft), onKeyDown: (e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                commitTag(tagDraft);
                            }
                        }, placeholder: "Select tags to filter" }), _jsx("datalist", { id: tagsListId, children: tagsList.map((t) => (_jsx("option", { value: t }, t))) }), _jsx("input", { list: kindListId, className: "filter-control__input", value: kind ?? '', onChange: (e) => updateFilter({
                            kind: e.target.value === '' ? undefined : e.target.value,
                        }), placeholder: "Select block kind to filter" }), _jsx("datalist", { id: kindListId, children: BLOCK_KINDS.map((t) => (_jsx("option", { value: t }, t))) }), _jsxs("div", { className: "filter-control__mode-selector", children: [_jsx("div", { className: "filter-control__mode", children: _jsx("button", { type: "button", className: !extended ? 'active' : '', onClick: () => updateFilter({ extended: false }), children: "Basic" }) }), _jsx("div", { className: "filter-control__mode", children: _jsx("button", { type: "button", className: extended ? 'active' : '', onClick: () => updateFilter({ extended: true }), children: "Advanced" }) })] })] }), extended && (_jsxs("div", { className: "filter-control__advanced", children: [_jsx("input", { id: "name-search", className: "filter-control__input", value: artName ?? '', placeholder: "Enter art name", onChange: (e) => updateFilter({ artName: e.target.value }) }), kind === 'gallery' && (_jsxs(_Fragment, { children: [_jsx("input", { id: "layout-style", list: "layouts-list", className: "filter-control__input", value: layout ?? '', onChange: (e) => updateFilter({
                                    layout: e.target.value
                                        ? e.target.value
                                        : undefined,
                                }), placeholder: "Select Layout style" }), _jsx("datalist", { id: "layouts-list", children: GALLERY_LAYOUTS.map((l) => (_jsx("option", { value: l }, l))) })] })), kind === 'cta' && (_jsxs(_Fragment, { children: [_jsx("input", { id: "cta-type", list: "cta-types-list", className: "filter-control__input", value: ctaType ?? '', onChange: (e) => updateFilter({ ctaType: e.target.value }), placeholder: "Select CTA type" }), _jsx("datalist", { id: "cta-types-list", children: CTA_TYPES.map((t) => (_jsx("option", { value: t }, t))) })] }))] }))] }));
}
