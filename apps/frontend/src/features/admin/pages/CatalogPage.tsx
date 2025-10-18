import type { ArtItemJSON, ImagesJSON } from '@/entities/art';
import { useEffect, useMemo, useState } from 'react';

import { FullPath } from '@/entities/art/images';
import { Availability, ISODate } from '@/entities/common';
import { HOPPER_LIST_URL, UPDATE_CATALOG } from '../api';
import './catalogPage.css';

interface HopperItem {
    name: string;
    url: string;
    previewUrl?: string;
    size?: number;
    mtime?: string;
}

export default function CatalogPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<HopperItem[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [q, setQ] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selected, setSelected] = useState<HopperItem | null>(null);
    const [draft, setDraft] = useState<ArtItemJSON | null>(null);
    const [saving, setSaving] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);
    const busy = loading || saving;
    const fmtDate = (d = new Date()) => d.toISOString().slice(0, 10) as ISODate;
    const newId = () =>
        crypto?.randomUUID
            ? crypto.randomUUID()
            : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                setError(null);
                const resp = await fetch(HOPPER_LIST_URL, { credentials: 'include' });
                if (!resp.ok) throw new Error(`Hopper list failed: ${resp.status}`);
                const data = (await resp.json()) as HopperItem[];
                setItems(data);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                setError(e.message || String(e));
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter((it) => it.name.toLowerCase().includes(s));
    }, [items, q]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onPick = (it: HopperItem) => {
        setSelected(it);
        const id = newId();
        const baseNameNoExt = it.name.replace(/\.[^.]+$/, '');
        // const preview = it.previewUrl ?? it.url;
        const draftItem: ArtItemJSON = {
            id,
            title: { ru: baseNameNoExt },
            dateCreated: fmtDate(),
            techniques: [],
            price: null,
            availability: 'available',
            series: null,
            tags: [],
            notes: null,
            images: {
                full: it.url as FullPath,
            } as ImagesJSON,
            dimensions: { width: 0, height: 0, unit: 'cm' },
        };
        setDraft(draftItem);
        setSavedId(null);
    };

    const updateDraft = (patch: Partial<ArtItemJSON>) =>
        setDraft((d) => (d ? { ...d, ...patch } : d));

    const save = async () => {
        if (!draft) return;
        setSaving(true);
        setSavedId(null);
        try {
            const resp = await fetch(UPDATE_CATALOG, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(draft),
            });
            if (!resp.ok) throw new Error(`Save failed: ${resp.status}`);
            const payload = await resp.json();
            setSavedId(payload?.id || draft.id || null);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setError(e.message || String(e));
        } finally {
            setSaving(false);
        }
    };
    if (loading) {
        return <div className="empty">Загружаю превью…</div>;
    }
    if (error) {
        return (
            <div className="empty" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                Ошибка: {error}
            </div>
        );
    }
    // if (!draft) {
    //     return <div className="empty">Выберите превью слева, чтобы начать.</div>;
    // }
    return (
        <div className="form-grid">
            <div className="form-field">
                <label className="form-label">Серия</label>
                <input
                    className="form-input"
                    value={draft.series ?? ''}
                    onChange={(e) => updateDraft({ series: e.target.value || null })}
                />
            </div>

            <div className="form-field">
                <label className="form-label">Теги (через запятую)</label>
                <input
                    className="form-input"
                    value={(draft.tags ?? []).join(', ')}
                    onChange={(e) =>
                        updateDraft({
                            tags: e.target.value.split(/\s*,\s*/).filter(Boolean),
                        })
                    }
                />
            </div>

            <div className="form-row-3">
                <div className="form-field">
                    <label className="form-label">Ширина</label>
                    <input
                        type="number"
                        min={0}
                        className="form-input"
                        value={draft.dimensions.width}
                        onChange={(e) =>
                            updateDraft({
                                dimensions: { ...draft.dimensions, width: Number(e.target.value) },
                            })
                        }
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Высота</label>
                    <input
                        type="number"
                        min={0}
                        className="form-input"
                        value={draft.dimensions.height}
                        onChange={(e) =>
                            updateDraft({
                                dimensions: { ...draft.dimensions, height: Number(e.target.value) },
                            })
                        }
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Ед. изм.</label>
                    <select
                        className="form-select"
                        value={draft.dimensions.unit ?? 'cm'}
                        onChange={(e) =>
                            updateDraft({
                                dimensions: {
                                    ...draft.dimensions,
                                    unit: e.target.value as 'cm' | 'in',
                                },
                            })
                        }
                    >
                        <option value="cm">cm</option>
                        <option value="mm">mm</option>
                        <option value="in">in</option>
                    </select>
                </div>
            </div>

            <div className="form-field">
                <label className="form-label">Заметки</label>
                <textarea
                    className="form-textarea"
                    value={draft.notes ?? ''}
                    onChange={(e) => updateDraft({ notes: e.target.value || null })}
                />
            </div>

            <fieldset
                className="form-field"
                style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}
            >
                <legend className="form-label">Цена (опционально)</legend>
                <div className="form-row-3">
                    <input
                        className="form-input"
                        placeholder="EUR"
                        value={draft.price?.currency ?? ''}
                        onChange={(e) => {
                            updateDraft({
                                price: {
                                    currency: 'EUR',
                                    // eslint-disable-next-line no-constant-binary-expression
                                    amount: Number(e.target.value) ?? 0,
                                },
                            });
                        }}
                    />
                    <input
                        className="form-input"
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0"
                        value={draft.price?.amount ?? 0}
                        onChange={(e) =>
                            updateDraft({
                                price: {
                                    currency: draft.price?.currency ?? 'EUR',
                                    amount: Number(e.target.value),
                                },
                            })
                        }
                    />
                    <button
                        type="button"
                        className="btn"
                        onClick={() => updateDraft({ price: null })}
                    >
                        Очистить цену
                    </button>
                </div>
            </fieldset>

            <div className="form-field">
                <label className="form-label">Статус доступности</label>
                <select
                    className="form-select"
                    value={draft.availability}
                    onChange={(e) => updateDraft({ availability: e.target.value as Availability })}
                >
                    <option value="available">available</option>
                    <option value="reserved">reserved</option>
                    <option value="sold">sold</option>
                    <option value="not_for_sale">not_for_sale</option>
                </select>
            </div>

            <div className="form-actions">
                <button className="btn btn--primary" onClick={save} disabled={busy}>
                    {busy ? 'Сохраняю…' : 'Сохранить в каталог'}
                </button>
                {savedId && <span className="status">Сохранено (id: {savedId})</span>}
            </div>
        </div>
    );
}
