import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCatalogEditorSession } from '@/features/admin/catalogEditor/catalogEditorSession/CatalogEditorSession.context';
import SingleArtItemEditor from '@/features/admin/catalogEditor/ui/SingleItemEditor/SingleArtItemEditor';
import { ArtCatalogFilterControl, } from '@/features/admin/shared/ui/ArtCatalogFilterControl';
import ArtItemGrid from '@/features/admin/shared/ui/ArtItemGrid/ArtItemGrid';
import { artItemToGridItem } from '@/features/admin/shared/ui/ArtItemGrid/utils';
import { bindToolbarCtx } from '@/pages/admin/catalogEditorPage/catalogEditor.adapter';
import { SingleEditorToolbar } from '@/shared/ui/SingleEditorToolbar/SingleEditorToolbar';
import { useEffect, useState } from 'react';
export default function CatalogEditorPage() {
    const { editorProps, toolbarModel, catalog, 
    // draft,
    onEscape, editorIsReady, isLoading, screenMode, isSelected, } = useCatalogEditorSession();
    const [displayGrid, setDisplayGrid] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(undefined);
    const tbCtx = bindToolbarCtx({ ...toolbarModel, selectedId: selectedItemId });
    const props = {
        editorProps,
        toolbarProps: tbCtx,
    };
    // Art filter:
    const [artFilter, setArtFilter] = useState({
        query: '',
        tags: [],
        technique: undefined,
        availability: undefined,
        series: undefined,
        hasPrice: false,
        extended: false,
    });
    const updateArtFilter = (patch) => {
        setArtFilter((prev) => ({ ...prev, ...patch }));
    };
    useEffect(() => {
        if (catalog && catalog.items) {
            const c_grid = Object.values(catalog.items).map(artItemToGridItem);
            setDisplayGrid(c_grid ?? []);
        }
    }, [catalog]);
    const onSelectHandler = (item) => {
        if (!item)
            return;
        setSelectedItemId(item.id);
    };
    // Toolbar settings:
    const gridToolbar = ['add', 'delete', 'edit', 'exit', 'apply'];
    // Here toolbar needed.
    // ❗️IMPORTANT: below selected means internal ArtItemGrid state,
    // NOT context state ❗️
    // if not selected toolbar menu = grid menu
    // if selected and editor is ready, menu = edit menu
    // ArtItemGrid make item selected (internal), but all operation through
    // toolbar menu
    switch (screenMode) {
        case 'edit':
            return (_jsxs("div", { className: "catalog-page", children: [isLoading && _jsx("p", { children: "Loading..." }), isSelected && editorIsReady && _jsx(SingleArtItemEditor, { ...props })] }));
        case 'select':
            return (_jsxs("div", { className: "catalog-page", children: [isLoading && _jsx("p", { children: "Loading..." }), !isLoading && !isSelected && (_jsxs("div", { children: [_jsx("div", { className: "catalog-editor__toolbar", children: _jsx(ArtCatalogFilterControl, { items: catalog?.items, filter: artFilter, updateFilter: updateArtFilter, onBack: onEscape }) }), _jsxs("div", { className: "catalog-editor__body", children: [_jsx(ArtItemGrid, { artCollection: displayGrid, selectedItemId: selectedItemId, setItemSelected: onSelectHandler }), _jsx(SingleEditorToolbar, { tools: gridToolbar, ctx: tbCtx })] })] }))] }));
    }
}
