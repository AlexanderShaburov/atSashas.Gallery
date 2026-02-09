import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import NumericInput from '@/features/admin/catalogEditor/ui/CreateForm/UX/NumericInput';
import { useState } from 'react';
function isCompletePrice(p) {
    return p.amount !== undefined && p.currency !== undefined;
}
export default function MoneyInput({ label = 'Price', value, onChange, idAmount = 'Amount', idCurrency = 'Currency', currencies, }) {
    const list = currencies ?? ['USD', 'EUR', 'ILS', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD'];
    const [draft, setDraft] = useState(value ?? {});
    const update = (next) => {
        const merged = { ...draft, ...next };
        setDraft(merged);
        if (isCompletePrice(merged))
            onChange(merged);
    };
    return (_jsxs("div", { className: "cf-row", children: [_jsx("span", { className: "cf-group-label", children: label }), _jsx("fieldset", { className: "cf-group", children: _jsxs("div", { className: "cf-inline cf-inline-2", children: [_jsxs("div", { className: "cf-field", children: [_jsx("label", { htmlFor: idAmount, className: "cf-sub-label", children: "Amount" }), _jsx(NumericInput, { id: `${label}-amount`, className: "cf-input", placeholder: "Amount", value: value?.amount, decimals: 2, allowNegative: false, onChangeNumber: (n) => update({ amount: n }) })] }), _jsxs("div", { className: "cf-field", children: [_jsx("label", { htmlFor: idCurrency, className: "cf-sub-label", children: "Currency" }), _jsx("select", { id: idCurrency, className: "cf-select cf-select--short", value: draft.currency, onChange: (e) => {
                                        if (e.target.value === undefined) {
                                            // if no amount yet, keep it unset but remember currency choice
                                            update({ currency: undefined });
                                        }
                                        else {
                                            const next = e.target.value;
                                            update({ currency: next });
                                        }
                                    }, children: list.map((c) => (_jsx("option", { value: c, children: c }, c))) })] })] }) })] }));
}
