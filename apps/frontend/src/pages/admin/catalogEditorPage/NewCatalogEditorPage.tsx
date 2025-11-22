import '@/pages/admin/catalogEditorPage/CatalogEditorPage.css';

import { Thumb } from '@/entities/catalog';
import { GridItem } from '@/entities/grid';
import { useEditorSession } from '@/features/admin/editorSession/EditorSession.context';
import HopperGrid from '@/features/admin/ui/HopperGrid/HopperGrid';
import { useEffect, useState } from 'react';
import { ArtGerm, ArtItem, ArtItemJSON } from '@/entities/art';

function JSONToArtAdaptor(item: ArtItemJSON): ArtItem {
    return {
        id: item.id,
        title: item.title,
        
    }
}

export default function CatalogEditorPage() {
    const [hopperGrid, setHopperGrid] = useState<GridItem[] | undefined>(undefined);
    const [catalogGrid, setCatalogGrid] = useState<GridItem[] | undefined>(undefined);

    const { identity, setIdentity, editorIsReady, catalog, hopper, loading, mode, setMode } = {
        ...useEditorSession(),
    };

    function thumbToGridItem(t: Thumb): GridItem {
        return {
            id: t.id,
            thumbUrl: t.src,
        };
    }
    function artItemToGridItem(a: ArtItem): GridItem {
        const p = a.images.previews;

        const jpeg = p.jpeg;
        const webp = p.webp;
        const avif = p.avif;

        const thumbUrl = jpeg || webp || avif || a.images.full;

        return {
            id: a.id,
            thumbUrl,
            sources: {
                avif,
                webp,
                jpeg,
            },
            title: a.title?.en ?? a.title?.ru,
        };
    }
    function gridToGermAdapter(item: GridItem): ArtGerm {
        switch (mode) {
            case 'create':
                return {
                    mode: 'create',
                    item: {
                        id: item.id,
                        src: item.thumbUrl,
                    }
                };
                break
            case 'edit':
                return {
                    mode: 'edit',
                    item: catalog?.items[item.id]

                    }
                }
        }

    }

    

    useEffect(() => {
        if (hopper && hopper.length) {
            const h_grid = hopper.map(thumbToGridItem);
            setHopperGrid(h_grid);
        }
        if (catalog && catalog.items) {
            const c_grid = Object.values(catalog.items).map(artItemToGridItem);
            setCatalogGrid(c_grid);
        }
    }, [hopper, catalog]);

    return (
        <div className="catalog-page">
            <header>
                {/* SWITCH MODE BUTTONS BLOCK  */}
                <button
                    className={mode === 'create' ? 'create' : ''}
                    onClick={() => setMode('create')}
                >
                    Create
                </button>
                <button className={mode === 'edit' ? 'edit' : ''} onClick={() => setMode('edit')}>
                    Edit
                </button>
            </header>
            <div className="grid">
                <HopperGrid 
                    hopper: {mode === 'create' ? hopperGrid : catalogGrid}
                    setIdentity={setIdentity}
                />
            </div>
        </div>
    );
}
