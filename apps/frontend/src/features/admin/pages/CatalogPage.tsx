import { useEffect, useRef, useState } from 'react';

import type { TechniquesJson } from '@/entities/art';
import type { Thumb } from '@/entities/catalog';
import { getCatalog, getHopperContent, getTechniques } from '@/features/admin/api';
import {
    CreateForm,
    type CreateFormProps,
    type CreateFormValues,
} from '@/features/admin/components/CreateForm';
import SingleItemEditor from '../components/SingleItemEditor';
import './catalogPage.css';

export default function CatalogPage() {
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hopper, setHopper] = useState<Thumb[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [techniques, setTechniques] = useState<TechniquesJson>({});
    const [formValues, setFormValues] = useState<CreateFormValues | null>(null);
    const [seriesOptions, setSeriesOptions] = useState<string[]>([]);

    const activeThumb = useRef<Thumb | null>(null);
    const formProps = useRef<CreateFormProps | null>(null);

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
    const onHopperClick = (h: Thumb) => {
        setSelected(h.id);
        // seed form with defaults; if in NOT required for create
        const initials = {
            dateCreated: '',
            availability: 'available',
            price_currency: 'EUR',
            unit: 'cm',
            // optional: alt_en prefill from filename without extension
            title_en: '',
            title_ru: '',
        } as CreateFormValues;
        setFormValues(initials);
        console.log(``);
        activeThumb.current = h;
        formProps.current = {
            techniques: techniques,
            initial: initials,
            onChange: setFormValues,
            seriesOptions: seriesOptions,
        };
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
    // DEBUG USE EFFECT -> TO BE DELETED!!!!
    useEffect(() => {
        console.log(`1. "selected" state is: ${selected}`);
        console.log(
            `2. "activeThumb.current" state is: ${JSON.stringify(activeThumb.current, null, 2)}`,
        );
        console.log(
            `3. "formProps.current.techniques" state is: ${JSON.stringify(formProps.current?.techniques, null, 2)}`,
        );
        console.log(
            `3. "formProps.current.seriesOptions" state is: ${JSON.stringify(formProps.current?.seriesOptions, null, 2)}`,
        );
        console.log(
            `3. "formProps.current.initial" state is: ${JSON.stringify(formProps.current?.initial, null, 2)}`,
        );
    }, [selected]);

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
    if (!selected) {
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
                                <img src={h.src} alt={h.id} loading="lazy" />
                                <div className="meta">{h.id}</div>
                            </button>
                        ))}
                        {hopper.length === 0 && <p>No uploads in hopper</p>}
                    </div>
                )}
            </div>
        );
    }
    if (selected && activeThumb.current && formProps.current) {
        return (
            <SingleItemEditor
                thumb={activeThumb.current}
                FormComponent={CreateForm}
                formProps={formProps.current}
            />
        );
    }
}
