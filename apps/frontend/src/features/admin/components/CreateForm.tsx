// CreateForm.tsx
import { TechniquesJson } from '@/entities/art';
import type { Availability, CurrencyName } from '@/entities/common';
import { useEffect, useMemo, useState } from 'react';

type Unit = 'cm' | 'in';

export interface CreateFormValues {
    dateCreated: string; // YYYY-MM-DD
    title_en?: string;
    title_ru?: string;
    category?: string; // techniques[0]
    technique?: string; // techniques[1]
    availability: Availability;
    width?: number;
    height?: number;
    unit: Unit;
    price_amount?: number;
    price_currency: CurrencyName;
    alt_en?: string;
    alt_ru?: string;
    series?: string;
    tags?: string;
    notes?: string;
}

const DEFAULT_CATEGORY = 'painting' as const;
const DEFAULT_TECHNIQUE = 'watercolor' as const;

function todayISO(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CreateForm({
    techniques,
    initial,
    onChange,
    seriesOptions = [],
}: {
    techniques: TechniquesJson;
    initial?: Partial<CreateFormValues> | undefined;
    onChange: (v: CreateFormValues) => void;
    seriesOptions?: string[];
}) {
    const categories = useMemo(
        () => Object.entries(techniques).map(([key, v]) => ({ key, label: v.label })),
        [techniques],
    );

    const [values, setValues] = useState<CreateFormValues>(() => {
        const defCat = initial?.category ?? categories[0]?.key ?? DEFAULT_CATEGORY;
        const defTech: string =
            initial?.technique ?? techniques[defCat]?.items[0]?.key ?? DEFAULT_TECHNIQUE;

        const v: CreateFormValues = {
            dateCreated: initial?.dateCreated ?? todayISO(),
            title_en: initial?.title_en ?? '',
            title_ru: initial?.title_ru ?? '',
            category: defCat,
            technique: defTech,
            availability: initial?.availability ?? 'available',
            // width: initial?.width,
            // height: initial?.height,
            unit: initial?.unit ?? 'cm',
            // price_amount: initial?.price_amount,
            price_currency: initial?.price_currency ?? 'EUR',
            alt_en: initial?.alt_en ?? '',
            alt_ru: initial?.alt_ru ?? '',
            series: initial?.series ?? '',
            tags: initial?.tags ?? '',
            notes: initial?.notes ?? '',
        };

        if (initial?.width !== undefined) v.width = initial.width;
        if (initial?.height !== undefined) v.height = initial.height;
        if (initial?.price_amount !== undefined) v.price_amount = initial.price_amount;

        return v;
    });

    useEffect(() => {
        onChange(values);
    }, [values, onChange]);

    const techsForCat = useMemo(() => {
        const raw = values.category ? (techniques[values.category]?.items ?? []) : [];
        // Normalize to { key, label }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return raw.map((it: any) => (typeof it === 'string' ? { key: it, label: it } : it));
    }, [values.category, techniques]);

    return (
        <div
            className="create-form"
            style={{
                display: 'grid',
                gap: '10px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 16,
            }}
        >
            <div>
                <label>Date</label>
                <br />
                <input
                    type="date"
                    value={values.dateCreated}
                    onChange={(e) => setValues((v) => ({ ...v, dateCreated: e.target.value }))}
                />
            </div>

            <div>
                <label>Title (EN)</label>
                <br />
                <input
                    value={values.title_en ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, title_en: e.target.value }))}
                />
            </div>

            <div>
                <label>Title (RU)</label>
                <br />
                <input
                    value={values.title_ru ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, title_ru: e.target.value }))}
                />
            </div>

            <div>
                <label>Category</label>
                <br />
                <select
                    value={values.category ?? ''}
                    onChange={(e) => {
                        const category = e.target.value;
                        const firstTech = techniques[category]?.items[0]?.key;

                        setValues((prev) => {
                            if (firstTech !== undefined) {
                                return { ...prev, category, techniques: firstTech };
                            } else {
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                const { technique: _omit, ...rest } = prev;
                                return { ...rest, category };
                            }
                        });
                    }}
                >
                    {categories.map((c) => (
                        <option key={c.key} value={c.key}>
                            {c.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label>Technique</label>
                <br />
                <select
                    value={values.technique ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, technique: e.target.value }))}
                >
                    {/* placeholder when technique is unset */}
                    {values.technique == null && (
                        <option value="" disabled>
                            — Select technique —
                        </option>
                    )}

                    {techsForCat.map((t) => (
                        <option key={t.key} value={t.key}>
                            {t.label}
                        </option>
                    ))}
                </select>
            </div>
            {/* SERIES with suggestions via datalist */}
            <div className="catalog-field">
                <label className="catalog-label">Series</label>
                <input
                    className="catalog-input"
                    list="series-list"
                    value={values.series ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, series: e.target.value }))}
                    placeholder="Start typing or pick…"
                />
                <datalist id="series-list">
                    {seriesOptions.map((s) => (
                        <option key={s} value={s} />
                    ))}
                </datalist>
            </div>
            {/* TAGS (comma-separated) */}
            <div className="catalog-field">
                <label className="catalog-label">Tags</label>
                <input
                    className="catalog-input"
                    value={values.tags ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, tags: e.target.value }))}
                    placeholder="comma, separated (e.g. roses, landscape)"
                />
            </div>

            {/* NOTES */}
            <div className="catalog-field">
                <label className="catalog-label">Notes</label>
                <textarea
                    className="catalog-textarea"
                    rows={3}
                    value={values.notes ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
                    placeholder="Any internal notes for admin…"
                />
            </div>

            <div>
                <label>Availability</label>
                <br />
                <select
                    value={values.availability}
                    onChange={(e) =>
                        setValues((v) => ({ ...v, availability: e.target.value as Availability }))
                    }
                >
                    <option value="available">available</option>
                    <option value="reserved">reserved</option>
                    <option value="sold">sold</option>
                    <option value="privateCollection">privateCollection</option>
                    <option value="notForSale">notForSale</option>
                </select>
            </div>

            <div>
                <label>Dimensions</label>
                <br />
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="number"
                        placeholder="W"
                        value={values.width ?? ''}
                        onChange={(e) =>
                            setValues((prev) => {
                                const raw = e.target.value;
                                const n = raw === '' ? undefined : Number(raw);

                                if (n === undefined) {
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    const { width: _omit, ...rest } = prev;
                                    return rest;
                                }

                                return { ...prev, width: n };
                            })
                        }
                    />
                    <input
                        type="number"
                        placeholder="H"
                        value={values.height ?? ''}
                        onChange={(e) =>
                            setValues((prev) => {
                                const raw = e.target.value;
                                const n = raw === '' ? undefined : Number(raw);

                                if (n === undefined) {
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    const { height: _omit, ...rest } = prev;
                                    return rest;
                                }
                                return { ...prev, height: n };
                            })
                        }
                    />
                    <select
                        value={values.unit}
                        onChange={(e) => setValues((v) => ({ ...v, unit: e.target.value as Unit }))}
                    >
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                    </select>
                </div>
            </div>

            <div>
                <label>Price</label>
                <br />
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={values.price_amount ?? ''}
                        onChange={(e) =>
                            setValues((prev) => {
                                const raw = e.target.value;
                                const n = raw === '' ? undefined : Number(raw);

                                if (n === undefined) {
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    const { price_amount: _omit, ...rest } = prev;
                                    return rest;
                                }
                                return { ...prev, price_amount: n };
                            })
                        }
                    />
                    <select
                        value={values.price_currency}
                        onChange={(e) =>
                            setValues((v) => ({
                                ...v,
                                price_currency: e.target.value as CurrencyName,
                            }))
                        }
                    >
                        {(
                            ['USD', 'EUR', 'ILS', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD'] as const
                        ).map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label>ALT (EN) This text fill in for image unavailable.</label>
                <br />
                <input
                    value={values.alt_en ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, alt_en: e.target.value }))}
                />
            </div>

            <div>
                <label>ALT (RU) Этот текст заменит картинку в случае недоступности</label>
                <br />
                <input
                    value={values.alt_ru ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, alt_ru: e.target.value }))}
                />
            </div>
        </div>
    );
}
