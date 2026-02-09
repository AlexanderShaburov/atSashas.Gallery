import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import '@/features/admin/catalogEditor/ui/CreateForm/CreateForm.css';
import DimensionsInput from '@/features/admin/catalogEditor/ui/CreateForm/UX/DimensionsInput';
import LangInput from '@/features/admin/catalogEditor/ui/CreateForm/UX/LangInput';
import MoneyInput from '@/features/admin/catalogEditor/ui/CreateForm/UX/MoneyInput';
// import TechniqueListEditor from '@/features/admin/ui/CreateForm/UX/TechniqueListEditor';
import TechniqueListEditor from '@/features/admin/catalogEditor/ui/CreateForm/UX/TechniqueListEditor';
export function CreateForm(props) {
    const { seriesOptions, editorIsReady, draft, onDraftChange } = props;
    if (!editorIsReady || !draft)
        return null;
    if (editorIsReady) {
        return (_jsxs("form", { className: "cf-form", onSubmit: (e) => e.preventDefault(), children: [_jsxs("div", { className: "cf-row", children: [_jsx("label", { htmlFor: "dateCreated", className: "cf-label", children: "Date" }), _jsx("input", { id: "dateCreated", type: "date", className: "cf-input", value: draft?.dateCreated ?? '', onChange: (e) => onDraftChange({ ...draft, dateCreated: e.target.value }) })] }), _jsx(LangInput, { label: "Title", value: { en: draft?.title?.en ?? '', ru: draft?.title?.ru ?? '' }, className: "cf-field--title", inputId: "title_multi", onChange: (e) => onDraftChange({ ...draft, title: e }), placeholder: "Here is artwork name" }), _jsx(TechniqueListEditor, { ...props }), _jsxs("div", { className: "cf-row", children: [_jsx("label", { htmlFor: "series", className: "cf-label", children: "Series" }), _jsx("input", { id: "series", list: "series-list", className: "cf-input", value: draft?.series ?? '', onChange: (e) => onDraftChange({ ...draft, series: e.target.value }), placeholder: "Start typing or pick\u2026" }), _jsx("datalist", { id: "series-list", children: seriesOptions.map((s) => (_jsx("option", { value: s }, s))) })] }), _jsxs("div", { className: "cf-row", children: [_jsx("label", { htmlFor: "tags", className: "cf-label", children: "Tags" }), _jsx("input", { id: "tags", className: "cf-input", value: draft?.tags?.join(', ') ?? '', onChange: (e) => {
                                const raw = e.target.value;
                                const tags = raw
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                if (!tags)
                                    return;
                                onDraftChange({ ...draft, tags });
                            }, placeholder: "comma, separated (e.g. roses, landscape)" })] }), _jsxs("div", { className: "cf-row", children: [_jsx("label", { htmlFor: "notes", className: "cf-label", children: "Notes" }), _jsx("textarea", { id: "notes", className: "cf-textarea", rows: 3, value: draft?.notes ?? '', onChange: (e) => onDraftChange({ ...draft, notes: e.target.value }), placeholder: "Say something about this artwork here." })] }), _jsxs("div", { className: "cf-row", children: [_jsx("label", { htmlFor: "availability", className: "cf-label", children: "Availability" }), _jsxs("select", { id: "availability", className: "cf-select", value: draft?.availability, onChange: (e) => onDraftChange({
                                ...draft,
                                availability: e.target.value,
                            }), children: [_jsx("option", { value: "available", children: "available" }), _jsx("option", { value: "reserved", children: "reserved" }), _jsx("option", { value: "sold", children: "sold" }), _jsx("option", { value: "privateCollection", children: "privateCollection" }), _jsx("option", { value: "notForSale", children: "notForSale" })] })] }), _jsx("div", { className: "cf-row", children: _jsx("div", { className: "cf-row--inline", children: _jsx(DimensionsInput, { label: "Dimensions", value: draft?.dimensions, onChange: (size) => {
                                if (!size)
                                    return;
                                onDraftChange({ ...draft, dimensions: size });
                            } }) }) }), _jsx(MoneyInput, { label: "Artwork price", value: draft?.price, onChange: (price) => onDraftChange({ ...draft, price: price }) }), _jsx(LangInput, { label: "Alt", className: "cf-field--alt", inputId: "alt_multi", value: draft?.alt, onChange: (next) => onDraftChange({ ...draft, alt: next }), placeholder: "Artwork short description" })] }));
    }
}
