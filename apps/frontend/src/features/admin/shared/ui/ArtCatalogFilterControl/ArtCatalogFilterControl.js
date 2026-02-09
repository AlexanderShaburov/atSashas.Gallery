import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import './ArtCatalogFilterControl.css';
export function ArtCatalogFilterControl({ items, filter, updateFilter, onBack }) {
    const { extended, technique, availability, series } = filter;
    const [tagDraft, setTagDraft] = useState('');
    const [techList, setTechList] = useState([]);
    const [tagList, setTagList] = useState([]);
    const [seriesList, setSeriesList] = useState([]);
    const [availabilityList, setAvailabilityList] = useState([]);
    const tagsListId = 'acfc-tags';
    const techListId = 'acfc-tech';
    const seriesListId = 'acfc-series';
    const availabilityListId = 'acfc-availability';
    const allItemsArray = useMemo(() => (items ? Object.values(items) : []), [items]);
    useEffect(() => {
        if (!items) {
            setTechList([]);
            setTagList([]);
            setSeriesList([]);
            setAvailabilityList([]);
            return;
        }
        const tags = new Set();
        const techs = new Set();
        const seriesSet = new Set();
        const availabilitySet = new Set();
        for (const it of Object.values(items)) {
            it.tags?.forEach((t) => tags.add(t));
            it.techniques?.forEach((t) => techs.add(t));
            if (it.series)
                seriesSet.add(it.series);
            if (it.availability)
                availabilitySet.add(String(it.availability));
        }
        setTagList(Array.from(tags).sort());
        setTechList(Array.from(techs).sort());
        setSeriesList(Array.from(seriesSet).sort());
        setAvailabilityList(Array.from(availabilitySet).sort());
    }, [items]);
    const commitTag = (v) => {
        const t = v.trim();
        if (!t)
            return;
        if (filter.tags.includes(t))
            return;
        updateFilter({ tags: [...filter.tags, t] });
        setTagDraft('');
    };
    const clearTags = () => updateFilter({ tags: [] });
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "art-filter-control__basic", children: [_jsx("input", { className: "art-filter-control__input", value: filter.query ?? '', onChange: (e) => updateFilter({ query: e.target.value }), placeholder: "Search title / id / file\u2026" }), _jsxs("div", { className: "art-filter-control__tags", children: [_jsx("input", { list: tagsListId, className: "art-filter-control__input", value: tagDraft, onChange: (e) => setTagDraft(e.target.value), onBlur: () => commitTag(tagDraft), onKeyDown: (e) => {
                                    if (e.key === 'Enter' || e.key === ',') {
                                        e.preventDefault();
                                        commitTag(tagDraft);
                                    }
                                }, placeholder: "Add tag\u2026" }), _jsx("datalist", { id: tagsListId, children: tagList.map((t) => (_jsx("option", { value: t }, t))) }), _jsxs("div", { className: "art-filter-control__chips", children: [filter.tags.map((t) => (_jsxs("button", { type: "button", className: "art-filter-control__chip", onClick: () => updateFilter({ tags: filter.tags.filter((x) => x !== t) }), title: "Remove tag", children: [t, " \u00D7"] }, t))), filter.tags.length > 0 && (_jsx("button", { type: "button", className: "art-filter-control__chip art-filter-control__chip--muted", onClick: clearTags, title: "Clear tags", children: "clear" }))] })] }), _jsx("input", { list: techListId, className: "art-filter-control__input", value: technique ?? '', onChange: (e) => updateFilter({ technique: e.target.value || undefined }), placeholder: "Technique" }), _jsx("datalist", { id: techListId, children: techList.map((t) => (_jsx("option", { value: t }, t))) }), _jsxs("div", { className: "art-filter-control__mode-selector", children: [_jsx("div", { className: "art-filter-control__mode art-filter-control__mode--basic", children: _jsx("button", { type: "button", className: !extended ? 'active' : '', onClick: () => updateFilter({ extended: false }), children: "Basic" }) }), _jsx("div", { className: "art-filter-control__mode art-filter-control__mode--advanced", children: _jsx("button", { type: "button", className: extended ? 'active' : '', onClick: () => updateFilter({ extended: true }), children: "Advanced" }) }), !!onBack && (_jsx("div", { className: "art-filter-control__mode art-filter-control__mode--back", children: _jsx("button", { type: "button", onClick: onBack, className: "art-filter-control__back", children: "Back" }) }))] })] }), extended && (_jsxs("div", { className: "art-filter-control__advanced", children: [_jsx("input", { list: availabilityListId, className: "art-filter-control__input", value: availability ?? '', onChange: (e) => updateFilter({ availability: e.target.value || undefined }), placeholder: "Availability" }), _jsx("datalist", { id: availabilityListId, children: availabilityList.map((v) => (_jsx("option", { value: v }, v))) }), _jsx("input", { list: seriesListId, className: "art-filter-control__input", value: series ?? '', onChange: (e) => updateFilter({ series: e.target.value || undefined }), placeholder: "Series" }), _jsx("datalist", { id: seriesListId, children: seriesList.map((v) => (_jsx("option", { value: v }, v))) }), _jsx("button", { type: "button", className: `art-filter-control__toggle ${filter.hasPrice ? 'on' : ''}`, onClick: () => updateFilter({ hasPrice: !filter.hasPrice }), disabled: allItemsArray.length === 0, title: "Filter items that have price", children: "Has price" })] }))] }));
}
