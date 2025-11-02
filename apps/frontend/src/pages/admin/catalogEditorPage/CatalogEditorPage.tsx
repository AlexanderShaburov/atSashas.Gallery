import { useEffect, useState } from 'react';

import type { Thumb } from '@/entities/catalog';
import { getHopperContent } from '@/features/admin/api';
import SingleItemEditor from '@/features/admin/ui/SingleItemEditor/SingleItemEditor';
import '@/pages/admin/catalogEditorPage/CatalogEditorPage.css';

import { useEditorSession } from '@/features/admin/editorSession/EditorSession.context';

export default function CatalogEditorPage() {
    const { startEditorSession, editorIsReady, exit, save, saving, isValid, isDirty } = {
        ...useEditorSession(),
    };

    // Important!!! In normal use default mode better to set to "edit"
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [error, setError] = useState<string | null>(null);
    const [hopper, setHopper] = useState<Thumb[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);

    const onThumbClick = (h: Thumb) => {
        setSelected(h.id);
        startEditorSession({ mode: mode, item: h });
    };

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
                setError(e instanceof Error ? e.message : String(e));
            } finally {
                setLoading(false);
            }
        })();
    }, [mode]);

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
    if (selected && editorIsReady) {
        return (
            <div className="catalog-page">
                <header>
                    <button onClick={exit}>← Back</button>

                    <button
                        onClick={save}
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
                <SingleItemEditor />
            </div>
        );
    }
}
