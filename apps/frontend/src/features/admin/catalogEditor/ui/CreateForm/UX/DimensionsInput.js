import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import NumericInput from '@/features/admin/catalogEditor/ui/CreateForm/UX/NumericInput';
import { useEffect, useState } from 'react';
function isCompleteDimensions(s) {
    return s.width !== undefined && s.height !== undefined && s.unit !== undefined;
}
export default function DimensionsInput({ label, value, onChange, inputId = 'size', }) {
    const list = ['cm', 'in'];
    const [draft, setDraft] = useState(value ?? {});
    useEffect(() => {
        setDraft((prev) => {
            if (!value)
                return prev;
            const same = prev?.height === value.height &&
                prev?.width === value.width &&
                prev?.unit === value.unit;
            return same ? prev : value;
        });
    }, [value]);
    const update = (next) => {
        const merged = { ...draft, ...next };
        setDraft(merged);
        if (isCompleteDimensions(merged))
            onChange(merged);
    };
    return (_jsxs("div", { className: "cf-row", children: [_jsx("span", { className: "cf-label", children: label }), _jsx("fieldset", { className: "cf-group", children: _jsxs("div", { className: "cf-inline cf-inline-3", children: [_jsxs("div", { className: "cf-field", children: [_jsx("label", { htmlFor: `${inputId}-width`, className: "cf-sub-label", children: "Width" }), _jsx(NumericInput, { id: `${inputId}-width`, className: "cf-input", placeholder: "Width", value: draft?.width, decimals: 2, onChangeNumber: (n) => update({ width: n }) })] }), _jsxs("div", { className: "cf-field", children: [_jsx("label", { htmlFor: inputId, className: "cf-sub-label", children: "Height" }), _jsx(NumericInput, { id: `${inputId}-height`, className: "cf-input", placeholder: "Height", value: draft?.height, decimals: 2, onChangeNumber: (n) => update({ height: n }) })] }), _jsxs("div", { className: "cf-field", children: [_jsx("label", { htmlFor: `${inputId}-unit`, className: "cf-sub-label", children: "Unit" }), _jsx("select", { id: `${inputId}-unit`, className: "cf-select cf-select--short", value: draft?.unit, onChange: (e) => {
                                        if (e.target.value === undefined) {
                                            // if no amount yet, keep it unset but remember currency choice
                                            update({ unit: undefined });
                                        }
                                        else {
                                            const currency = { unit: e.target.value };
                                            update({ ...draft, ...currency });
                                        }
                                    }, children: list.map((c) => (_jsx("option", { value: c, children: c }, c))) })] })] }) })] }));
}
