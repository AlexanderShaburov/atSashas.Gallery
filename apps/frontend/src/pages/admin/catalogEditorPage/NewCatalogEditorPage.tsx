// src/pages/admin/catalogEditorPage/NewCatalogEditorPage.tsx

import { GridItem } from '@/entities/grid';
import { useCatalogEditorSession } from '@/features/admin/catalogEditor/catalogEditorSession/newCatalogEditorSession.context';
import SingleItemEditor from '@/features/admin/catalogEditor/ui/SingleItemEditor/SingleItemEditor';
import ArtItemGrid from '@/features/admin/shared/ui/ArtItemGrid/ArtItemGrid';
import { artItemToGridItem } from '@/features/admin/shared/ui/ArtItemGrid/utils';
import { useEffect, useState } from 'react';

export const CatalogEditorPage = () => {
    const [displayGrid, setDisplayGrid] = useState<GridItem[]>([]);

    const {
        editorProps,
        catalog,
        onSelect,
        canSave,
        isLoading,
        screenMode,
        isSelected,
        editorIsReady,
    } = useCatalogEditorSession();

    useEffect(() => {
        if (catalog && catalog.items) {
            const c_grid = Object.values(catalog.items).map(artItemToGridItem);
            setDisplayGrid(c_grid ?? []);
        }
    }, [catalog]);

    return (
        <>
            <div className="catalog-page">
                {isLoading ? (
                    <p>Loading...</p>
                ) : (
                    !isSelected && (
                        <div /*className="grid"*/>
                            <ArtItemGrid artCollection={displayGrid} setIdentity={onSelect} />
                        </div>
                    )
                )}
            </div>
            {isSelected && editorIsReady && (
                <div className="catalog-page">
                    <SingleArtItemEditor props={editorProps} />
                </div>
            )}
        </>
    );
};
