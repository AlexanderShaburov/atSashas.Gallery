import { useCallback, useEffect, useRef, useState } from 'react';

import type { Thumb } from '@/entities/catalog';
import { getCatalog, getHopperContent, getTechniques } from '@/features/admin/api';
import {
    CreateForm,
    type CreateFormProps,
    type FormValues,
} from '@/features/admin/ui/CreateForm/CreateForm';
import SingleItemEditor from '@/features/admin/ui/SingleItemEditor/SingleItemEditor';
import '@/pages/admin/CatalogEditorPage.css';

import { validateCreateForm } from '@/features/admin/utils/Validators';
import { deepEqual } from '@/features/admin/utils/checkers';
import { isEmptyErrors, validateErrors } from '@/features/admin/utils/errorMapper';

// for Edit mode pull up ArtItem and transform it to FormValues
// here beforehand downloaded catalog.json should be used catalog.items[id.id]

export default function CatalogEditorPage() {
    const { identity, formValues, setFormValues, isDirty, isValid, saving, save, exit } = ue;
    const [loading, setLoading] = useState(false);
    const [hopper, setHopper] = useState<Thumb[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const activeThumb = useRef<Thumb | null>(null);
    const formProps = useRef<CreateFormProps | null>(null);

    // Recompute on form validity change:
    useEffect(() => {
        setErrors(validateErrors(formValues));
    }, [formValues]);

    // adjust current isValid:
    useEffect(() => {
        setIsValid(isEmptyErrors(errors));
    }, [errors]);

    const handleSave = useCallback(async () => {
        if (!formValues) return;
        if (!isValid) {
            alert('Please fix the highlighted fields before saving.');
            return;
        }
        setSaving(true);
        try {
            // TODO: transform FormValues -> ArtItemJSON as your saver expects
            // e.g., call a helper build function and POST to backend:
            // const payload = buildArtItemJSON({ form: formValues, imageId: activeThumb.current!.id });
            // await apiSaveToCatalog(payload);

            // For now, just simulate success:
            await new Promise((r) => setTimeout(r, 500));

            // mark clean and go back to hopper
            setIsDirty(false);
            setSelected(null);

            // clear editor refs if you want a fresh session after save
            activeThumb.current = null;
            initialSnapshot.current = null;
            formProps.current = null;
            setFormValues(null);
        } catch (e) {
            console.error('Save failed', e);
            alert('Save failed. Check console for details.');
        } finally {
            setSaving(false);
        }
    }, [formValues, isValid]);

    const handleCancel = useCallback(() => {
        if (isDirty && !confirm('Discard unsaved changes?')) return;

        // wipe editor session state:
        setSelected(null);
        setFormValues(null);
        setIsDirty(false);

        //clear refs to avoid state data when opening another item:
        activeThumb.current = null;
        initialSnapshot.current = null;

        //also clear fromProps:
        formProps.current = null;
    }, [isDirty]);

    {
        /* 
        Validation rules:

        id, dateCreated (YYYY-MM-DD), technique, availability,

        at least one of title or alt has any non-empty value,

        dimensions.w/h > 0 and unit is present.

        (Tweak as you like—e.g., require category or price later.) 
        */
    }
    useEffect(() => {
        setIsValid(validateCreateForm(formValues));
    }, [formValues]);

    // ESC shortcut to cancel:
    useEffect(() => {
        if (!selected) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleCancel();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selected, handleCancel]);

    // load techniques once
    useEffect(() => {
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
    const onThumbClick = (h: Thumb) => {
        setSelected(h.id);
        // seed form with defaults; if in NOT required for create
        // Here we will set mode checker and give to createForm current
        // values from ArtItem object in edit mode.
        const initials = prepareInitials() as FormValues;
        setFormValues(initials);
        activeThumb.current = h;
        initialSnapshot.current = initials; // <- baseline for dirty check
        setIsDirty(false); //reset

        formProps.current = {
            techniques: techniques, // All range of ...
            initial: initials,
            onChange: setFormValues,
            seriesOptions: seriesOptions,
        };
    };

    useEffect(() => {
        if (!initialSnapshot.current || !formValues) return;
        setIsDirty(!deepEqual(initialSnapshot.current, formValues));
    }, [formValues]);

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
                                onClick={() => onThumbClick(h)}
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
            <EditorSessionContext.Provider
                value={{
                    formValues,
                    setFormValues,
                    se,
                }}
            >
                <div className="catalog-page">
                    <header>
                        <button onClick={handleBack}>← Back</button>
                        <button onClick={handleCancel} style={{ marginLeft: 8 }}>
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!isValid || saving}
                            style={{ marginLeft: 8 }}
                            title={!isValid ? 'Form is not valid' : 'Save this item'}
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                        {isDirty && (
                            <span className="dirty-dot" title="Unsaved changes">
                                •
                            </span>
                        )}
                        <span style={{ marginLeft: 12, opacity: 0.7 }}>
                            {isValid ? '✓ Valid' : '⚠ Not valid'}
                        </span>
                    </header>
                    <SingleItemEditor
                        thumb={activeThumb.current}
                        FormComponent={CreateForm}
                        formProps={formProps.current}
                        onSave={handleSave}
                        onBack={handleBack}
                        onCancel={handleCancel}
                        values={formValues}
                        errors={errors}
                        touched={touched}
                        markTouched={(name: string) => setTouched((t) => ({ ...t, [name]: true }))}
                    />
                </div>
            </EditorSessionContext.Provider>
        );
    }
}
