// CreateForm.tsx
import { TechniquesJson } from '@/entities/art';
import type { Availability, Dimensions, ISODate, Localized, Money } from '@/entities/common';
import '@/features/admin/ui/CreateForm/CreateForm.css';
import DimensionsInput from '@/features/admin/ui/CreateForm/UX/DimensionsInput';
import LangInput from '@/features/admin/ui/CreateForm/UX/LangInput';
import MoneyInput from '@/features/admin/ui/CreateForm/UX/MoneyInput';
import { useEffect, useMemo, useState } from 'react';

export interface CreateFormValues {
    id: string;
    dateCreated?: ISODate;
    title: Localized | undefined;
    category?: string | undefined;
    technique: string | undefined; // techniques[1]
    availability: Availability | undefined;
    dimensions: Dimensions | undefined;
    price: Money | undefined;
    alt: Localized | undefined;
    series: string | undefined;
    tags: string[] | undefined;
    notes: string | undefined;
}

const DEFAULT_CATEGORY = 'painting' as const;
const DEFAULT_TECHNIQUE = 'watercolor' as const;

// eslint-disable-next-line react-refresh/only-export-components
export function todayISO(): ISODate {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}` as ISODate;
}
export type CreateFormProps = {
    techniques: TechniquesJson; // techniques in CatalogEditorPage.tsx
    initial: Pick<CreateFormValues, 'id'> & Partial<Omit<CreateFormValues, 'id'>>; // formValues
    onChange: (v: CreateFormValues) => void; // setFormValues()
    seriesOptions: string[]; // seriesOptions
};

export function CreateForm({ techniques, initial, onChange, seriesOptions = [] }: CreateFormProps) {
    const categories = useMemo(
        () => Object.entries(techniques).map(([key, v]) => ({ key, label: v.label })),
        [techniques],
    );

    const [values, setValues] = useState<CreateFormValues>(() => {
        const defCat: string = categories[0]?.key ?? DEFAULT_CATEGORY;
        const defTech: string =
            initial?.technique ?? techniques[defCat]?.items[0]?.key ?? DEFAULT_TECHNIQUE;

        const v: CreateFormValues = {
            id: initial.id,
            dateCreated: initial?.dateCreated ?? todayISO(),
            title: initial?.title,
            category: defCat,
            technique: defTech,
            availability: initial?.availability,
            dimensions: initial?.dimensions,
            price: initial?.price,
            alt: initial?.alt,
            series: initial?.series,
            tags: initial?.tags,
            notes: initial?.notes,
        };

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
        <form className="cf-form" onSubmit={(e) => e.preventDefault()}>
            {/* Date */}
            <div className="cf-row">
                <label htmlFor="dateCreated" className="cf-label">
                    Date
                </label>
                <input
                    id="dateCreated"
                    type="date"
                    className="cf-input"
                    value={values.dateCreated}
                    onChange={(e) =>
                        setValues((v) => ({ ...v, dateCreated: e.target.value as ISODate }))
                    }
                />
            </div>

            {/* Title */}
            <LangInput
                label="Title"
                value={{ en: values.title?.en ?? '', ru: values.alt?.ru ?? '' }}
                className="cf-field--title"
                inputId="title_multi"
                onChange={(next) =>
                    setValues((v) => ({
                        ...v,
                        title: next,
                    }))
                }
                placeholder="Here is artwork name"
            />

            {/* Category */}
            <div className="cf-row">
                <label htmlFor="category" className="cf-label">
                    Category
                </label>
                <select
                    id="category"
                    className="cf-select"
                    value={values.category}
                    onChange={(e) => {
                        const category = e.target.value;
                        // const firstTech = techniques[category]?.items[0]?.key;
                        setValues((prev) => ({ ...prev, category: category }));
                    }}
                >
                    {categories.map((c) => (
                        <option key={c.key} value={c.key}>
                            {c.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Technique */}
            <div className="cf-row">
                <label htmlFor="technique" className="cf-label">
                    Technique
                </label>
                <select
                    id="technique"
                    className="cf-select"
                    value={values.technique}
                    onChange={(e) => setValues((v) => ({ ...v, technique: e.target.value }))}
                >
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

            {/* Series with datalist */}
            <div className="cf-row">
                <label htmlFor="series" className="cf-label">
                    Series
                </label>
                <input
                    id="series"
                    list="series-list"
                    className="cf-input"
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

            {/* Tags */}
            <div className="cf-row">
                <label htmlFor="tags" className="cf-label">
                    Tags
                </label>
                <input
                    id="tags"
                    className="cf-input"
                    value={values.tags?.join(', ') ?? ''}
                    onChange={(e) => {
                        const raw = e.target.value;
                        const tags = raw
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                        setValues((v) => ({
                            ...v,
                            tags: tags.length ? tags : undefined,
                        }));
                    }}
                    placeholder="comma, separated (e.g. roses, landscape)"
                />
            </div>

            {/* Notes */}
            <div className="cf-row">
                <label htmlFor="notes" className="cf-label">
                    Notes
                </label>
                <textarea
                    id="notes"
                    className="cf-textarea"
                    rows={3}
                    value={values.notes ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
                    placeholder="Say something about this artwork here."
                />
            </div>

            {/* Availability */}
            <div className="cf-row">
                <label htmlFor="availability" className="cf-label">
                    Availability
                </label>
                <select
                    id="availability"
                    className="cf-select"
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

            {/* Dimensions */}
            <div className="cf-row">
                {/* <span className="cf-label">Dimensions</span> */}
                <div className="cf-row--inline">
                    <DimensionsInput
                        label="Dimensions"
                        value={values.dimensions}
                        onChange={(size) => setValues((prev) => ({ ...prev, dimensions: size }))}
                    />
                </div>
            </div>

            {/* Price */}
            <MoneyInput
                label="Artwork price"
                value={values.price}
                onChange={(next) => setValues((prev) => ({ ...prev, price: next }))}
            />
            {/* ALT */}
            <LangInput
                label="Alt"
                className="cf-field--alt"
                inputId="alt_multi"
                value={values.alt}
                onChange={(next) =>
                    setValues((v) => ({
                        ...v,
                        alt: next,
                    }))
                }
                placeholder="Artwork short description"
            />
        </form>
    );
}
