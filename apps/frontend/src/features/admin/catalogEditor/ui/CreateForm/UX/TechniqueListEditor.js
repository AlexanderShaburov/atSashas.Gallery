import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
function normalizeItems(raw) {
    return raw.map((it) => typeof it === 'string'
        ? { key: it, label: it }
        : { key: it.key, label: it.label ?? it.key });
}
export default function TechniqueListEditor(props) {
    const { draft, onDraftChange, techniquesRange } = props;
    // показывать ли панель добавления (категория+техника)
    const [adding, setAdding] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedTechnique, setSelectedTechnique] = useState('');
    // категории (левая часть выпадающего выбора)
    const categories = useMemo(() => techniquesRange
        ? Object.entries(techniquesRange).map(([key, def]) => ({
            key,
            label: def.label ?? key,
        }))
        : [], [techniquesRange]);
    // актуальный список техник по выбранной категории
    const techsForCat = useMemo(() => {
        if (!techniquesRange || !selectedCategory)
            return [];
        const def = techniquesRange[selectedCategory];
        return normalizeItems(def?.items ?? []);
    }, [selectedCategory, techniquesRange]);
    // выбранные техники из формы (строки)
    const chosen = draft?.techniques ?? [];
    const addTechnique = (tech) => {
        if (!draft)
            throw new Error('Form not ready');
        const nextList = draft.techniques ? [...draft.techniques] : [];
        if (!nextList.includes(tech))
            nextList.push(tech);
        onDraftChange({ ...draft, techniques: nextList });
        setAdding(false); // close pane after got added
    };
    const removeTechnique = (tech) => {
        if (!draft)
            throw new Error('Form not ready');
        const nextList = (draft.techniques ?? []).filter((t) => t !== tech);
        return { ...draft, techniques: nextList };
    };
    return (_jsxs("div", { className: "cf-group", children: [_jsx("div", { className: "cf-group-label", children: "Techniques" }), _jsxs("div", { className: "cf-tech-editor", style: { alignItems: 'stretch' }, children: [_jsx("div", { className: "cf-field", style: { width: '100%' }, children: _jsx("div", { className: "cf-input", role: "listbox", "aria-label": "Selected techniques", style: {
                                minHeight: 90,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem',
                            }, children: chosen.length === 0 ? (_jsx("div", { style: { opacity: 0.7, fontStyle: 'italic' }, children: "No techniques yet" })) : (chosen.map((t) => (_jsxs("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto',
                                    gap: '0.5rem',
                                    alignItems: 'center',
                                }, children: [_jsx("span", { children: t }), _jsx("button", { type: "button", className: "cf-input cf-select--short", onClick: () => removeTechnique(t), "aria-label": `Remove ${t}`, children: "\u2212" })] }, t)))) }) }), _jsx("div", { className: "cf-field cf-tech-actions", style: { minWidth: 120 }, children: !adding ? (_jsx("button", { type: "button", className: "cf-select", onClick: () => {
                                setSelectedCategory('');
                                setSelectedTechnique('');
                                setAdding(true);
                            }, "aria-label": "Add technique", children: "\uFF0B Add" })) : (_jsxs(_Fragment, { children: [_jsxs("select", { className: "cf-select", value: selectedCategory, onChange: (e) => {
                                        setSelectedCategory(e.target.value);
                                        setSelectedTechnique('');
                                    }, children: [_jsx("option", { value: "", children: 'Select category' }), categories.map((c) => (_jsx("option", { value: c.key, children: c.label }, c.key)))] }), _jsxs("select", { className: "cf-select", value: selectedTechnique, onChange: (e) => {
                                        const tech = e.target.value;
                                        setSelectedTechnique(tech);
                                        addTechnique(tech);
                                        setAdding(false);
                                    }, disabled: !selectedCategory || techsForCat.length === 0, children: [_jsx("option", { value: "", children: 'Select technique' }), ' ', techsForCat.map((t) => (_jsx("option", { value: t.key, children: t.label }, t.key)))] }), _jsx("button", { type: "button", className: "cf-select", onClick: () => setAdding(false), "aria-label": "Cancel adding", children: "Cancel" })] })) })] })] }));
}
