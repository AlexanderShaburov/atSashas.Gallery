<fieldset className="cf-group">
    <legend className="cf-group-label">{label}</legend>

    <div className="cf-inline cf-inline-2">
        <div className="cf-field">
            <label htmlFor={`${label}-amount`} className="cf-sub-label">
                Amount
            </label>
            <NumericInput
                id={`${label}-amount`}
                className="cf-input"
                placeholder="Amount"
                value={value?.amount}
                decimals={2}
                onChangeNumber={(n) => {
                    // tailor to your Money shape:
                    if (n == null && !value?.currency) return onChange(undefined);
                    if (value?.currency)
                        return onChange(
                            n == null
                                ? {
                                      amount: undefined as unknown as number,
                                      currency: value.currency,
                                  }
                                : { currency: value.currency, amount: n },
                        );
                    // no currency yet:
                    return onChange(undefined);
                }}
            />
        </div>

        <div className="cf-field">
            <label htmlFor={`${label}-currency`} className="cf-sub-label">
                Currency
            </label>
            <select
                id={`${label}-currency`}
                className="cf-select cf-select--short"
                value={value?.currency ?? ''}
                onChange={(e) => {
                    const currency = e.target.value as CurrencyName;
                    if (!currency) return onChange(undefined);
                    if (value?.amount != null) return onChange({ amount: value.amount, currency });
                    return onChange({ amount: undefined as unknown as number, currency });
                }}
            >
                <option value="" disabled>
                    —
                </option>
                {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                        {c}
                    </option>
                ))}
            </select>
        </div>
    </div>
</fieldset>;
