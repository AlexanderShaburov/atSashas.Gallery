import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export default function NumericInput({ id, className, placeholder, value, onChangeNumber, decimals = 2, allowNegative = false, }) {
    const [text, setText] = useState(value != null ? String(value) : '');
    useEffect(() => {
        setText(value != null ? String(value) : '');
    }, [value]);
    const decPart = decimals > 0 ? `{0, ${decimals}}` : `{0,0}`;
    const sign = allowNegative ? '-?' : '';
    const allowed = new RegExp(`^${sign}\\d*(?:[.,]\\d${decPart})?$`);
    return (_jsx("input", { id: id, type: "text", inputMode: "decimal", enterKeyHint: "done", className: className, placeholder: placeholder, value: text ?? '', onChange: (e) => {
            const t = e.target.value.trim();
            if (t === '' || allowed.test(t)) {
                setText(t);
            }
        }, onBlur: () => {
            if (text === '') {
                onChangeNumber(undefined);
                return;
            }
            const n = Number(text.replace(',', '.'));
            if (!Number.isNaN(n))
                onChangeNumber(n);
        } }));
}
