// src/pages/admin/catalogEditorPage/CatalogEditorPage.tsx

import { GridItem } from '@/shared/ui/grid';
import { useCatalogEditorSession } from '@/features/admin/catalogEditor/catalogEditorSession/CatalogEditorSession.context';
import SingleArtItemEditor, {
    SAProps,
} from '@/features/admin/catalogEditor/ui/SingleItemEditor/SingleArtItemEditor';
import {
    ArtCatalogFilterControl,
    ArtCatalogFilterState,
    applyArtCatalogFilter,
} from '@/features/admin/shared/ui/ArtCatalogFilterControl';
import ArtItemGrid from '@/features/admin/shared/ui/ArtItemGrid/ArtItemGrid';
import { bindToolbarCtx } from '@/pages/admin/catalogEditorPage/catalogEditor.adapter';
import { ToolbarCtx, ToolKey } from '@/shared/ui/SingleEditorToolbar/single-editor-toolbar.types';
import { SingleEditorToolbar } from '@/shared/ui/SingleEditorToolbar/SingleEditorToolbar';
import { useCallback, useEffect, useState } from 'react';

export default function CatalogEditorPage() {
    const {
        editorProps,
        toolbarModel,
        catalog,
        techniquesRange,
        onEscape,
        editorIsReady,
        isLoading,
        screenMode,
        isSelected,
        selectedItemId,
        selectItem,
    } = useCatalogEditorSession();

    const [displayGrid, setDisplayGrid] = useState<GridItem[]>([]);

    const tbCtx: ToolbarCtx = bindToolbarCtx({ ...toolbarModel, selectedId: selectedItemId });
    const props: SAProps = {
        editorProps,
        toolbarProps: tbCtx,
    };
    // Art filter:
    const [artFilter, setArtFilter] = useState<ArtCatalogFilterState>({
        query: '',
        tags: [],
        technique: undefined,
        availability: undefined,
        series: undefined,
        hasPrice: false,
        extended: false,
    });

    const updateArtFilter = (patch: Partial<ArtCatalogFilterState>) => {
        setArtFilter((prev) => ({ ...prev, ...patch }));
    };

    useEffect(() => {
        if (catalog && catalog.items) {
            setDisplayGrid(applyArtCatalogFilter(catalog.items, artFilter));
        }
    }, [catalog, artFilter]);

    const onSelectHandler = useCallback(
        (item: GridItem | undefined): void => {
            selectItem(item?.id);
        },
        [selectItem],
    );

    // Toolbar settings:
    const gridToolbar: ToolKey[] = ['add', 'delete', 'edit', 'exit', 'apply'];

    switch (screenMode) {
        case 'edit':
            return (
                <div className="catalog-page">
                    {isLoading && <p>Loading...</p>}
                    {isSelected && editorIsReady && <SingleArtItemEditor {...props} />}
                </div>
            );
        case 'select':
            return (
                <div className="catalog-page">
                    {isLoading && <p>Loading...</p>}
                    {!isLoading && !isSelected && (
                        <div /*className="grid"*/>
                            <div className="catalog-editor__toolbar">
                                <ArtCatalogFilterControl
                                    items={catalog?.items}
                                    techniquesRange={techniquesRange}
                                    filter={artFilter}
                                    updateFilter={updateArtFilter}
                                    onBack={onEscape}
                                />
                            </div>
                            <div className="catalog-editor__body">
                                <ArtItemGrid
                                    artCollection={displayGrid}
                                    selectedItemId={selectedItemId}
                                    setItemSelected={onSelectHandler}
                                />
                                <div className="set__toolbar">
                                    <SingleEditorToolbar tools={gridToolbar} ctx={tbCtx} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
    }
}
