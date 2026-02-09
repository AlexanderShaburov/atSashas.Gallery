import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
function isEmptyLocalized(obj, langs) {
    if (!obj)
        return true;
    return langs.every((lc) => !obj[lc] || obj[lc]?.trim() === '');
}
export default function LangInput({ label, value, onChange, availableLangs, initialLang = 'en', className, inputId, placeholder, }) {
    const LANGS = availableLangs ?? ['en', 'ru', 'it', 'es', 'pt'];
    const [lang, setLang] = useState(initialLang);
    const [draft, setDraft] = useState(value);
    // keep local draft in sync when parent value changes
    useEffect(() => {
        if (!value)
            setDraft(value);
    }, [value]);
    // build safe input id
    const fieldId = useMemo(() => inputId ?? `${label.replace(/\s+/g, '-').toLowerCase()}-${lang}`, [inputId, label, lang]);
    function updateLangValue(text) {
        const next = { ...(draft ?? {}), [lang]: text };
        setDraft(next);
        onChange(isEmptyLocalized(next, LANGS) ? undefined : next);
    }
    return (_jsxs("div", { className: `cf-row cf-lang ${className ?? ''}`, children: [_jsx("label", { htmlFor: fieldId, className: "cf-label", children: label }), _jsxs("div", { className: "cf-lang-wrap", children: [_jsx("input", { id: fieldId, className: "cf-input", value: draft?.[lang] ?? '', placeholder: placeholder, onChange: (e) => updateLangValue(e.target.value) }), _jsx("select", { "aria-label": `${label} language`, className: "cf-select cf-select--lang", value: lang, onChange: (e) => setLang(e.target.value), children: LANGS.map((ls) => (_jsx("option", { value: ls, children: ls.toUpperCase() }, ls))) })] })] }));
}
