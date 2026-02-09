import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import { CollectionGrid } from '@/features/admin/blocks/ui/CollectionGrid/CollectionGrid';
import { FilterControl } from '@/features/admin/blocks/ui/FilterControl';
import { SingleBlockEditor } from '@/features/admin/blocks/ui/SingleBlockEditor/SingleBlockEditor';
import '@/features/admin/shared/ui/BlockPreview/index';
import '@/pages/admin/BlocksPage/BlocksPage.css';
import { useEffect, useState } from 'react';
export function BlockEditor() {
    const session = useBlockEditorSession();
    const [selectedItemId, setSelectedItemId] = useState(undefined);
    const [filter, setFilter] = useState({
        tags: [],
        kind: undefined,
        layout: undefined,
        ctaType: undefined,
        artName: '',
        extended: false,
    });
    // Updated filter setter:
    const updateFilter = (patch) => {
        setFilter((prev) => ({ ...prev, ...patch }));
    };
    const toolbarProps = {
        canSave: session.canSave,
        isSaving: session.saving,
        save: session.onSaveClick,
        exit: session.exit,
        onDelete: session.onDelete,
        tags: session.draft?.tags,
        onChangeTags: session.updateTags,
        onApply: session.onApply,
        isJourney: session.isJourney,
    };
    const { collection, currentStack, 
    // mode,
    // identity,
    // loading,
    // saving,
    // isDirty,
    // isValid,
    // canSave,
    // save,
    // exit,
    // removeCollection,
    onHit,
    // setSelectedArtItem,
     } = session;
    const { screenMode, onEscape } = currentStack;
    // const catalog = useArtCatalog();
    // const [artFilter, setArtFilter] = useState<ArtCatalogFilterState>({
    //     query: '',
    //     tags: [],
    //     technique: undefined,
    //     availability: undefined,
    //     series: undefined,
    //     hasPrice: false,
    //     extended: false,
    // });
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                onEscape();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onEscape]);
    const testHit = (hit) => {
        console.log(`[BlockEditor]: hit detected`);
        session.onHit(hit);
    };
    // const updateArtFilter = (patch: Partial<ArtCatalogFilterState>) => {
    //     setArtFilter((prev) => ({ ...prev, ...patch }));
    // };
    switch (screenMode) {
        case 'edit':
            if (!session.draft)
                return _jsx("div", { children: "Setting..." });
            // throw new Error(`[BlockEditor]: Try edit nonexistent block draft`);
            return (_jsx("div", { className: "block-editor", children: _jsx("div", { className: "block-editor__body", children: _jsx(SingleBlockEditor, { item: session.draft, onHit: testHit, setValue: session.setDraft, toolbarProps: toolbarProps }) }) }));
        case 'select':
            return (_jsxs("div", { className: "block-editor", children: [_jsx("div", { className: "block-editor__toolbar", children: _jsx(FilterControl, { filter: filter, updateFilter: updateFilter }) }), _jsx("div", { className: "block-editor__body", children: _jsx(CollectionGrid, { collection: collection, onHit: onHit, setValue: session.setDraft }) })] }));
        // case 'pickArt': {
        //     const artCollection = applyArtCatalogFilter(catalog.items, artFilter);
        //     console.log(`[BlockEditor]: artCollection is: `);
        //     console.dir(artCollection);
        //     return (
        //         <div className="block-editor">
        //             <div className="block-editor__toolbar">
        //                 <ArtCatalogFilterControl
        //                     items={catalog?.items}
        //                     filter={artFilter}
        //                     updateFilter={updateArtFilter}
        //                     onBack={onEscape}
        //                 />
        //             </div>
        //             <div className="block-editor__body">
        //                 <ArtItemGrid
        //                     artCollection={artCollection}
        //                     setItemSelected={setSelectedArtItem}
        //                 />
        //             </div>
        //         </div>
        //     );
        // }
    }
}
