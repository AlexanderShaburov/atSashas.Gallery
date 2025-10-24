import type { CurrencyName, Money } from '@/entities/common';
import { useState } from 'react';
import NumericInput from './NumericInput';

interface MoneyInputProps {
    label: string;
    value: Money | undefined;
    onChange: (next?: Money) => void;
    idAmount?: string;
    idCurrency?: string;
    currencies?: readonly CurrencyName[];
}
type PriceDraft = {
    amount?: number | undefined;
    currency?: CurrencyName | undefined;
};

function isCompletePrice(p: PriceDraft): boolean {
    return p.amount !== undefined && p.currency !== undefined;
}

export default function MoneyInput({
    label = 'Price',
    value,
    onChange,
    idAmount = 'Amount',
    idCurrency = 'Currency',
    currencies,
}: MoneyInputProps) {
    const list: readonly CurrencyName[] =
        currencies ?? (['USD', 'EUR', 'ILS', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD'] as const);

    const [draft, setDraft] = useState<PriceDraft>(value ?? {});

    const update = (next: Partial<PriceDraft>) => {
        const merged = { ...draft, ...next };
        setDraft(merged);
        if (isCompletePrice(merged)) onChange(merged as Money);
    };

    return (
        <div className="cf-row">
            <span className="cf-label">{label}</span>

            <div className="cf-row-inline cf-money-wrap">
                <div>
                    <label htmlFor={idAmount} className="cf-label">
                        Amount
                    </label>
                    <NumericInput
                        id={`${label}-amount`}
                        className="cf-input"
                        placeholder="Amount"
                        value={value?.amount}
                        decimals={2}
                        allowNegative={false}
                        onChangeNumber={(n) => update({ amount: n })}
                    />
                </div>
                <div>
                    <label htmlFor={idCurrency} className="cf-label">
                        Currency
                    </label>
                </div>
                <select
                    id={idCurrency}
                    className="cf-select"
                    value={draft.currency}
                    onChange={(e) => {
                        if (e.target.value === undefined) {
                            // if no amount yet, keep it unset but remember currency choice
                            update({ currency: undefined });
                        } else {
                            const next = e.target.value as CurrencyName;
                            update({ currency: next });
                        }
                    }}
                >
                    {list.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
