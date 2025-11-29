import { useEffect, useState } from 'react';

type NumericInputProps = {
    id?: string;
    className?: string;
    placeholder?: string;
    value?: number | undefined;
    onChangeNumber: (next?: number) => void;
    decimals?: number;
    allowNegative?: boolean;
};

export default function NumericInput({
    id,
    className,
    placeholder,
    value,
    onChangeNumber,
    decimals = 2,
    allowNegative = false,
}: NumericInputProps) {
    const [text, setText] = useState<string>(value != null ? String(value) : '');

    useEffect(() => {
        setText(value != null ? String(value) : '');
    }, [value]);

    const decPart = decimals > 0 ? `{0, ${decimals}}` : `{0,0}`;
    const sign = allowNegative ? '-?' : '';
    const allowed = new RegExp(`^${sign}\\d*(?:[.,]\\d${decPart})?$`);

    return (
        <input
            id={id}
            type="text"
            inputMode="decimal"
            enterKeyHint="done"
            className={className}
            placeholder={placeholder}
            value={text}
            onChange={(e) => {
                const t = e.target.value.trim();
                if (t === '' || allowed.test(t)) {
                    setText(t);
                }
            }}
            onBlur={() => {
                if (text === '') {
                    onChangeNumber(undefined);
                    return;
                }
                const n = Number(text.replace(',', '.'));
                if (!Number.isNaN(n)) onChangeNumber(n);
            }}
        />
    );
}
