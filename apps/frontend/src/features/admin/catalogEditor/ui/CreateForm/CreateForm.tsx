// CreateForm.tsx
import type { Availability, ISODate } from '@/entities/common';
import '@/features/admin/catalogEditor/ui/CreateForm/CreateForm.css';
import DimensionsInput from '@/features/admin/catalogEditor/ui/CreateForm/UX/DimensionsInput';
import LangInput from '@/features/admin/catalogEditor/ui/CreateForm/UX/LangInput';
import MoneyInput from '@/features/admin/catalogEditor/ui/CreateForm/UX/MoneyInput';
// import TechniqueListEditor from '@/features/admin/ui/CreateForm/UX/TechniqueListEditor';
import TechniqueListEditor from '@/features/admin/catalogEditor/ui/CreateForm/UX/TechniqueListEditor';
import { SingleItemEditorProps } from '@/pages/admin/catalogEditorPage/catalogEditor.types';

export function CreateForm(props: SingleItemEditorProps) {
    const { seriesOptions, editorIsReady, draft, onDraftChange } = props;

    if (!editorIsReady || !draft) return null;

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
                        value={draft?.dateCreated ?? ''}
                        onChange={(e) =>
                            onDraftChange({ ...draft, dateCreated: e.target.value as ISODate })
                        }
                    />
                </div>

                {/* Title */}
                <LangInput
                    label="Title"
                    value={{ en: draft?.title?.en ?? '', ru: draft?.title?.ru ?? '' }}
                    className="cf-field--title"
                    inputId="title_multi"
                    onChange={(e) => onDraftChange({ ...draft, title: e })}
                    placeholder="Here is artwork name"
                />

                {/* Select techniques from the list */}
                <TechniqueListEditor {...props} />

                {/* Series with datalist */}
                <div className="cf-row">
                    <label htmlFor="series" className="cf-label">
                        Series
                    </label>
                    <input
                        id="series"
                        list="series-list"
                        className="cf-input"
                        value={draft?.series ?? ''}
                        onChange={(e) => onDraftChange({ ...draft, series: e.target.value })}
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
                        value={draft?.tags?.join(', ') ?? ''}
                        onChange={(e) => {
                            const raw = e.target.value;
                            const tags = raw
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean);
                            if (!tags) return;
                            onDraftChange({ ...draft, tags });
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
                        value={draft?.notes ?? ''}
                        onChange={(e) =>
                            onDraftChange({ ...draft, notes: e.target.value as string })
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
                        value={draft?.availability}
                        onChange={(e) =>
                            onDraftChange({
                                ...draft,
                                availability: e.target.value as Availability,
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
                            value={draft?.dimensions}
                            onChange={(size) => {
                                if (!size) return;
                                onDraftChange({ ...draft, dimensions: size });
                            }}
                        />
                    </div>
                </div>

                {/* Price */}
                <MoneyInput
                    label="Artwork price"
                    value={draft?.price}
                    onChange={(price) => onDraftChange({ ...draft, price: price })}
                />
                {/* ALT */}
                <LangInput
                    label="Alt"
                    className="cf-field--alt"
                    inputId="alt_multi"
                    value={draft?.alt}
                    onChange={(next) => onDraftChange({ ...draft, alt: next })}
                    placeholder="Artwork short description"
                />
            </form>
        );
    }
}
