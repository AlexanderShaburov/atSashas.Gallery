type CurrencyName = 'USD' | 'EUR' | 'ILS' | 'GBP' | 'CHF' | 'JPY' | 'CNY' | 'CAD' | 'AUD';

type Money = { amount: number; currency: CurrencyName };
type MoneyDraft = { amount?: number; currency?: CurrencyName };

function isCompleteMoney(d: MoneyDraft): d is Money {
    return d.amount !== undefined && d.currency !== undefined;
}

type MoneyInputProps = {
    value?: Money; // controlled final value (optional)
    onChange: (value: Money) => void; // fire only when complete
};

export function MoneyInput({ value, onChange }: MoneyInputProps) {
    // seed draft from final value (if any)
    const [draft, setDraft] = React.useState<MoneyDraft>(value ?? {});

    // keep draft in sync if parent changes value externally
    React.useEffect(() => setDraft(value ?? {}), [value?.amount, value?.currency]);

    const update = (next: Partial<MoneyDraft>) => {
        const merged = { ...draft, ...next };
        setDraft(merged);
        if (isCompleteMoney(merged)) onChange(merged); // only call when complete
    };

    return (
        <div>
            <input
                type="number"
                placeholder="Amount"
                value={draft.amount ?? ''}
                onChange={(e) =>
                    update({ amount: e.target.value ? Number(e.target.value) : undefined })
                }
            />
            <select
                value={draft.currency ?? ''}
                onChange={(e) => update({ currency: e.target.value as CurrencyName })}
            >
                <option value="" disabled>
                    Select currency
                </option>
                {(['USD', 'EUR', 'ILS', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD'] as const).map(
                    (c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ),
                )}
            </select>
        </div>
    );
}
