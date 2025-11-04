// TechniqueListEditor.tsx
import type { TechniquesJson } from '@/entities/art';
import { useEditorSession } from '@/features/admin/editorSession/EditorSession.context';
import { useMemo, useState } from 'react';
type TechniqueItem = { key: string; label: string };

function normalizeItems(raw: Array<string | TechniqueItem>): TechniqueItem[] {
    return raw.map((it) =>
        typeof it === 'string'
            ? { key: it, label: it }
            : { key: it.key, label: it.label ?? it.key },
    );
}

export default function TechniqueListEditor() {
    const { values, setValues, techniques } = useEditorSession();

    // показывать ли панель добавления (категория+техника)
    const [adding, setAdding] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedTechnique, setSelectedTechnique] = useState<string>('');

    // категории (левая часть выпадающего выбора)
    const categories = useMemo(
        () =>
            techniques
                ? Object.entries(techniques as TechniquesJson).map(([key, def]) => ({
                      key,
                      label: def.label ?? key,
                  }))
                : [],
        [techniques],
    );

    // актуальный список техник по выбранной категории
    const techsForCat = useMemo<TechniqueItem[]>(() => {
        if (!techniques || !selectedCategory) return [];
        const def = (techniques as TechniquesJson)[selectedCategory];
        return normalizeItems(def?.items ?? []);
    }, [selectedCategory, techniques]);

    // выбранные техники из формы (строки)
    const chosen = values?.techniques ?? [];

    const addTechnique = (tech: string) => {
        setValues((prev) => {
            if (!prev) throw new Error('Form not ready');
            const nextList = prev.techniques ? [...prev.techniques] : [];
            if (!nextList.includes(tech)) nextList.push(tech);
            return { ...prev, techniques: nextList };
        });
        setAdding(false); // свернуть панель после добавления
    };

    const removeTechnique = (tech: string) => {
        setValues((prev) => {
            if (!prev) throw new Error('Form not ready');
            const nextList = (prev.techniques ?? []).filter((t) => t !== tech);
            return { ...prev, techniques: nextList };
        });
    };

    return (
        <div className="cf-group">
            <div className="cf-group-label">Techniques</div>
            <div className="cf-tech-editor" style={{ alignItems: 'stretch' }}>
                {/* Левая часть: список выбранных техник */}
                <div className="cf-field" style={{ width: '100%' }}>
                    <div
                        className="cf-input"
                        role="listbox"
                        aria-label="Selected techniques"
                        style={{
                            minHeight: 90,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                        }}
                    >
                        {chosen.length === 0 ? (
                            <div style={{ opacity: 0.7, fontStyle: 'italic' }}>
                                No techniques yet
                            </div>
                        ) : (
                            chosen.map((t) => (
                                <div
                                    key={t}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        gap: '0.5rem',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span>{t}</span>
                                    <button
                                        type="button"
                                        className="cf-select cf-select--short"
                                        onClick={() => removeTechnique(t)}
                                        aria-label={`Remove ${t}`}
                                    >
                                        −
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Правая часть: кнопки действий */}
                <div className="cf-field cf-tech-actions" style={{ minWidth: 120 }}>
                    {!adding ? (
                        <button
                            type="button"
                            className="cf-select"
                            onClick={() => {
                                setSelectedCategory('');
                                setSelectedTechnique('');
                                setAdding(true);
                            }}
                            aria-label="Add technique"
                        >
                            ＋ Add
                        </button>
                    ) : (
                        <>
                            {/* Select category */}
                            <select
                                className="cf-select"
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setSelectedTechnique('');
                                }}
                            >
                                <option value="">{'Select category'}</option>
                                {categories.map((c) => (
                                    <option key={c.key} value={c.key}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>

                            {/* Select techniques */}
                            <select
                                className="cf-select"
                                value={selectedTechnique}
                                onChange={(e) => {
                                    const tech = e.target.value;
                                    setSelectedTechnique(tech);
                                    addTechnique(tech);
                                    setAdding(false);
                                }}
                                disabled={!selectedCategory || techsForCat.length === 0}
                            >
                                {/* placeholder */}
                                <option value="">{'Select technique'}</option>{' '}
                                {techsForCat.map((t) => (
                                    <option key={t.key} value={t.key}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>

                            {/* Отмена добавления */}
                            <button
                                type="button"
                                className="cf-select"
                                onClick={() => setAdding(false)}
                                aria-label="Cancel adding"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
