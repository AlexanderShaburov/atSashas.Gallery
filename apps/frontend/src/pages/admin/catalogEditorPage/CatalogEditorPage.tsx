import '@/pages/admin/catalogEditorPage/CatalogEditorPage.css';

import { ArtItemData } from '@/entities/art';
import { GridItem } from '@/entities/grid';
import { useEditorSession } from '@/features/admin/editorSession/EditorSession.context';
import HopperGrid from '@/features/admin/ui/HopperGrid/HopperGrid';
import SingleItemEditor from '@/features/admin/ui/SingleItemEditor/SingleItemEditor';
import { useEffect, useState } from 'react';

export default function CatalogEditorPage() {
    const [hopperGrid, setHopperGrid] = useState<GridItem[]>([]);
    const [catalogGrid, setCatalogGrid] = useState<GridItem[]>([]);
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
        setHopperGrid(hopper ?? []);

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
                setDisplayGrid(hopperGrid ?? []);

                console.log(`[displayGrid]: hopperGrid set to display`);
                console.log('[displayGrid]:', hopperGrid);
                console.log('[displayGrid]: while hopper is: ', hopper);
                break;

            case 'edit': {
                setDisplayGrid(catalogGrid ?? []);
            }
        }
    }, [mode, hopperGrid, catalogGrid]);

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
