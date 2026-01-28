import '@/pages/admin/catalogEditorPage/CatalogEditorPage.css';

import { GridItem } from '@/entities/grid';
import { useEditorSession } from '@/features/admin/catalogEditor/catalogEditorSession/CatalogEditorSession.context';
import SingleItemEditor from '@/features/admin/catalogEditor/ui/SingleItemEditor/SingleItemEditor';
import ArtItemGrid from '@/features/admin/shared/ui/ArtItemGrid/ArtItemGrid';
import { artItemToGridItem } from '@/features/admin/shared/ui/ArtItemGrid/utils';
import { useEffect, useState } from 'react';

export default function CatalogEditorPage() {
    const [artItemGrid, setArtItemGrid] = useState<GridItem[]>([]);
    const [catalogGrid, setCatalogGrid] = useState<GridItem[]>([]);
    const [displayGrid, setDisplayGrid] = useState<GridItem[]>([]);

    const { identity, setIdentity, editorIsReady, catalog, hopper, loading, mode, setMode } = {
        ...useEditorSession(),
    };

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
        setArtItemGrid(hopper ?? []);

        if (catalog && catalog.items) {
            const c_grid = Object.values(catalog.items).map(artItemToGridItem);
            setCatalogGrid(c_grid ?? []);
        }
    }, [hopper, catalog]);

    // Form displayGrid:

    useEffect(() => {
        console.log(`[displayGrid] setter called`);
        switch (mode) {
            case 'create':
                setDisplayGrid(artItemGrid ?? []);
                break;

            case 'edit': {
                setDisplayGrid(catalogGrid ?? []);
            }
        }
    }, [mode, artItemGrid, catalogGrid]);

    return (
        <>
            <div className="catalog-page">
                <header>
                    {/* SWITCH MODE BUTTONS BLOCK  */}
                    <button
                        className={mode === 'create' ? 'active' : ''}
                        onClick={() => setMode('create')}
                    >
                        Create
                    </button>
                    <button
                        className={mode === 'edit' ? 'active' : ''}
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
                            <ArtItemGrid artCollection={displayGrid} setIdentity={onClickHandler} />
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
