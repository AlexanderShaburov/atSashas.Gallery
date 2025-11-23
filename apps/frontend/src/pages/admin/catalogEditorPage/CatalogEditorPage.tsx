import '@/pages/admin/catalogEditorPage/CatalogEditorPage.css';

import { ArtItemData } from '@/entities/art';
import { GridItem } from '@/entities/grid';
import { useEditorSession } from '@/features/admin/editorSession/EditorSession.context';
import HopperGrid from '@/features/admin/ui/HopperGrid/HopperGrid';
import SingleItemEditor from '@/features/admin/ui/SingleItemEditor/SingleItemEditor';
import { useEffect, useState } from 'react';

export default function CatalogEditorPage() {
    const [hopperGrid, setHopperGrid] = useState<GridItem[] | undefined>(undefined);
    const [catalogGrid, setCatalogGrid] = useState<GridItem[] | undefined>(undefined);
    const [displayGrid, setDisplayGrid] = useState<GridItem[]>([]);

    const { identity, setIdentity, editorIsReady, catalog, hopper, loading, mode, setMode } = {
        ...useEditorSession(),
    };

    function artItemToGridItem(a: ArtItemData): GridItem {
        const thumbUrl = a.images.full as string;
        return {
            id: a.id,
            thumbUrl: thumbUrl,
            title: a.title?.en ?? a.title?.ru ?? '',
        };
    }

    function onClickHandler(t: GridItem | undefined) {
        if (!t) {
            return;
        }
        switch (mode) {
            case 'create':
                setIdentity({
                    mode: mode,
                    item: t,
                });
                break;
            case 'edit': {
                if (!catalog) {
                    return;
                }
                const art = catalog.items[t.id];
                if (!art) {
                    return;
                }

                setIdentity({
                    mode: mode,
                    item: art,
                });
                break;
            }
        }
    }

    useEffect(() => {
        if (hopper && hopper.length) {
            setHopperGrid(hopper);
        }
        if (catalog && catalog.items) {
            const c_grid = Object.values(catalog.items).map(artItemToGridItem);
            setCatalogGrid(c_grid);
        }
    }, [hopper, catalog]);

    // Form displayGrid:

    useEffect(() => {
        switch (mode) {
            case 'create': {
                if (hopperGrid) {
                    setDisplayGrid(hopperGrid);
                }
                break;
            }
            case 'edit': {
                if (catalogGrid) {
                    setDisplayGrid(catalogGrid);
                }
            }
        }
    }, [mode, hopperGrid, catalogGrid]);

    return (
        <>
            <div className="catalog-page">
                <header>
                    {/* SWITCH MODE BUTTONS BLOCK  */}
                    <button
                        className={mode === 'create' ? 'create' : ''}
                        onClick={() => setMode('create')}
                    >
                        Create
                    </button>
                    <button
                        className={mode === 'edit' ? 'edit' : ''}
                        onClick={() => setMode('edit')}
                    >
                        Edit
                    </button>
                </header>
                {loading ? (
                    <p>Loading data</p>
                ) : (
                    !identity && (
                        <div /*className="grid"*/>
                            <HopperGrid hopper={displayGrid} setIdentity={onClickHandler} />
                        </div>
                    )
                )}
            </div>
            {identity && editorIsReady && (
                <div className="catalog-page">
                    <SingleItemEditor />
                </div>
            )}
        </>
    );
}
