import { useEffect, useState } from 'react';

import type { TechniquesJson } from '@/entities/art';
import type { HopperThumb } from '@/entities/catalog';
import { getCatalog, getHopperContent, getTechniques } from '@/features/admin/api';
import { CreateForm, type CreateFormValues } from '@/features/admin/components/CreateForm';
import './catalogPage.css';

export default function CatalogPage() {
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hopper, setHopper] = useState<HopperThumb[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [techniques, setTechniques] = useState<TechniquesJson>({});
    const [formValues, setFormValues] = useState<CreateFormValues | null>(null);
    const [seriesOptions, setSeriesOptions] = useState<string[]>([]);

    useEffect(() => {
        // load techniques once
        (async () => {
            try {
                const t = await getTechniques();
                setTechniques(t);
            } catch (e) {
                if (e instanceof Error) setError(e.message);
                else setError(String(e));
            }
        })();
    }, []);

    // when user clicks  on hopper card
    const onHopperClick = (h: HopperThumb) => {
        setSelected(h.id);
        // seed form with defaults; if in NOT required for create
        setFormValues({
            dateCreated: '',
            availability: 'available',
            price_currency: 'EUR',
            unit: 'cm',
            // optional: alt_en prefill from filename without extension
            title_en: '',
            title_ru: '',
        });
    };
    useEffect(() => {
        // create series list to have for choose from
        // if (mode !== 'create') return;
        // ⬆  series field could be edited not only in 'create' mode, it also could
        //      be edited later.
        (async () => {
            try {
                const cat = await getCatalog();
                const set = new Set<string>();
                for (const id of cat.order) {
                    const s = cat.items[id]?.series;
                    if (s && s.trim()) set.add(s.trim());
                }
                setSeriesOptions([...set].sort((a, b) => a.localeCompare(b)));
            } catch (e) {
                console.log(`It is series reader error! Hello!`);
                if (e instanceof Error) {
                    setError(e.message);
                } else setError(String(e));
            }
        })();
    }, [mode]);

    useEffect(() => {
        // if mode =  create it reads Hopper content
        if (mode !== 'create') return;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const list = await getHopperContent();
                setHopper(list);
            } catch (e) {
                if (e instanceof Error) setError(e.message);
                else setError(String(e));
            } finally {
                setLoading(false);
            }
        })();
    }, [mode]);
    // PLACEHOLDER FOR  EDIT CATALOG PAGE
    if (mode !== 'create') {
        return (
            <div className="catalog-page">
                <header>
                    <button onClick={() => setMode('create')}>Create</button>
                    <button className="active">Edit</button>
                </header>
                <p>Edit mode coming next</p>
            </div>
        );
    }
    return (
        <div className="catalog-page">
            <header>
                {/* SWITCH MODE BUTTONS BLOCK  */}
                <button className="active">Create</button>
                <button onClick={() => setMode('edit')}>Edit</button>
                {error && <span style={{ color: 'crimson' }}>{error}</span>}
            </header>
            {loading ? (
                <p>Loading hopper`</p>
            ) : (
                // HOPPER CONTENT GRID
                <div className="grid">
                    {hopper.map((h) => (
                        <button
                            key={h.id}
                            className={`card ${selected === h.id ? 'selected' : ''}`}
                            onClick={() => onHopperClick(h)}
                            title={h.id}
                        >
                            <img src={h.url} alt={h.id} loading="lazy" />
                            <div className="meta">{h.id}</div>
                        </button>
                    ))}
                    {hopper.length === 0 && <p>No uploads in hopper</p>}
                </div>
            )}
            {selected && (
                <section className="catalog-form-section">
                    <h3 className="catalog-form-title">Metadata for: {selected}</h3>

                    {Object.keys(techniques).length === 0 ? (
                        <p className="catalog-form-loading">Loading techniques...</p>
                    ) : (
                        <CreateForm
                            techniques={techniques}
                            initial={formValues ?? undefined}
                            onChange={(v) => setFormValues(v)}
                            seriesOptions={seriesOptions}
                        />
                    )}
                    {/* Submit button */}
                </section>
            )}
        </div>
    );
}
