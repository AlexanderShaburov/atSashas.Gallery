// CreateForm.tsx
import type { Availability, ISODate } from '@/entities/common';
import { useEditorSession } from '@/features/admin/editorSession/EditorSession.context';
import '@/features/admin/ui/CreateForm/CreateForm.css';
import DimensionsInput from '@/features/admin/ui/CreateForm/UX/DimensionsInput';
import LangInput from '@/features/admin/ui/CreateForm/UX/LangInput';
import MoneyInput from '@/features/admin/ui/CreateForm/UX/MoneyInput';
// import TechniqueListEditor from '@/features/admin/ui/CreateForm/UX/TechniqueListEditor';
import TechniqueListEditor from '@/features/admin/ui/CreateForm/UX/TechniqueListEditor';

export function CreateForm() {
    const { values, setValues, seriesOptions, editorIsReady } = useEditorSession();

    if (!editorIsReady || !values) return null;

    if (editorIsReady) {
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
                        value={values?.dateCreated ?? ''}
                        onChange={(e) =>
                            setValues((prev) => {
                                if (!prev) throw new Error('Form not ready');
                                return { ...prev, dateCreated: e.target.value as ISODate };
                            })
                        }
                    />
                </div>

                {/* Title */}
                <LangInput
                    label="Title"
                    value={{ en: values?.title?.en ?? '', ru: values?.title?.ru ?? '' }}
                    className="cf-field--title"
                    inputId="title_multi"
                    onChange={(e) =>
                        setValues((prev) => {
                            if (!prev) throw new Error('Form not ready');
                            return { ...prev, title: e };
                        })
                    }
                    placeholder="Here is artwork name"
                />

                {/* Select techniques from the list */}
                <TechniqueListEditor />

                {/* Series with datalist */}
                <div className="cf-row">
                    <label htmlFor="series" className="cf-label">
                        Series
                    </label>
                    <input
                        id="series"
                        list="series-list"
                        className="cf-input"
                        value={values?.series ?? ''}
                        onChange={(e) =>
                            setValues((prev) => {
                                if (!prev) throw new Error('Form not ready');
                                return { ...prev, series: e.target.value };
                            })
                        }
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
                        value={values?.tags?.join(', ') ?? ''}
                        onChange={(e) => {
                            const raw = e.target.value;
                            const tags = raw
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean);
                            setValues((prev) => {
                                if (!prev) throw new Error('Form not ready');
                                return { ...prev, tags: tags.length ? tags : undefined };
                            });
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
                        value={values?.notes ?? ''}
                        onChange={(e) =>
                            setValues((prev) => {
                                if (!prev) throw new Error('Form not ready');
                                return { ...prev, notes: e.target.value as string };
                            })
                        }
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
                        value={values?.availability}
                        onChange={(e) =>
                            setValues((prev) => {
                                if (!prev) throw new Error('Form not ready');
                                return { ...prev, availability: e.target.value as Availability };
                            })
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
                            value={values?.dimensions}
                            onChange={(size) =>
                                setValues((prev) => {
                                    if (!prev) throw new Error('Form not ready');
                                    return { ...prev, dimensions: size };
                                })
                            }
                        />
                    </div>
                </div>

                {/* Price */}
                <MoneyInput
                    label="Artwork price"
                    value={values?.price}
                    onChange={(price) =>
                        setValues((prev) => {
                            if (!prev) throw new Error('Form not ready');
                            return { ...prev, price: price };
                        })
                    }
                />
                {/* ALT */}
                <LangInput
                    label="Alt"
                    className="cf-field--alt"
                    inputId="alt_multi"
                    value={values?.alt}
                    onChange={(next) =>
                        setValues((prev) => {
                            if (!prev) throw new Error('Form not ready');
                            return { ...prev, alt: next };
                        })
                    }
                    placeholder="Artwork short description"
                />
            </form>
        );
    }
}
