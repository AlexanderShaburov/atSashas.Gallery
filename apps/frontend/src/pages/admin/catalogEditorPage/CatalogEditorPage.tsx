import type { Thumb } from '@/entities/catalog';
import { useEffect, useState } from 'react';

import { getHopperContent } from '@/features/admin/api';
import SingleItemEditor from '@/features/admin/ui/SingleItemEditor/SingleItemEditor';
import '@/pages/admin/catalogEditorPage/CatalogEditorPage.css';

import { useEditorSession } from '@/features/admin/editorSession/EditorSession.context';

export default function CatalogEditorPage() {
    const { identity, setIdentity, editorIsReady } = {
        ...useEditorSession(),
    };

    // Important!!! In normal use default mode better to set to "edit"
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [error, setError] = useState<string | null>(null);
    const [hopper, setHopper] = useState<Thumb[]>([]);
    const [loading, setLoading] = useState(false);

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
    if (!identity) {
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
                                className={`card`}
                                onClick={() => setIdentity({ mode: mode, item: h })}
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
    if (identity && editorIsReady) {
        return (
            <div className="catalog-page">
                <SingleItemEditor />
            </div>
        );
    }
}
