//@/features/admin/blocks/BlockEditor/BlockEditor.tsx
import type { BlockEditorSession } from '@/features/admin/blocks/blockEditorSession';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates';
import { CollectionGrid } from '@/features/admin/blocks/ui/CollectionGrid/CollectionGrid';
import { FilterControl, type BlockFilterState } from '@/features/admin/blocks/ui/FilterControl';
import { SingleBlockEditor } from '@/features/admin/blocks/ui/SingleBlockEditor/SingleBlockEditor';
import '@/features/admin/shared/ui/BlockPreview/index';
import '@/pages/admin/BlocksPage/BlocksPage.css';
import { useEffect, useState } from 'react';

export function BlockEditor() {
    const session: BlockEditorSession = useBlockEditorSession();
    const [filter, setFilter] = useState<BlockFilterState>({
        tags: [],
        kind: undefined,
        layout: undefined,
        ctaType: undefined,
        artName: '',
        extended: false,
    });
    // Updated filter setter:
    const updateFilter = (patch: Partial<BlockFilterState>) => {
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

    const {
        collection,
        currentStack,
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
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onEscape();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onEscape]);

    const testHit = (hit: BlockHitEvent) => {
        console.log(`[BlockEditor]: hit detected`);
        session.onHit(hit);
    };

    // const updateArtFilter = (patch: Partial<ArtCatalogFilterState>) => {
    //     setArtFilter((prev) => ({ ...prev, ...patch }));
    // };

    switch (screenMode) {
        case 'edit':
            if (!session.draft) return <div>Setting...</div>;

            // throw new Error(`[BlockEditor]: Try edit nonexistent block draft`);
            return (
                <div className="block-editor">
                    <div className="block-editor__body">
                        <SingleBlockEditor
                            item={session.draft}
                            onHit={testHit}
                            setValue={session.setDraft}
                            toolbarProps={toolbarProps}
                            addEventPlaceholder={session.addEventPlaceholder}
                            updateItemCaption={session.updateItemCaption}
                            updateBlockCaption={session.updateBlockCaption}
                        />
                    </div>
                </div>
            );
        case 'select':
            return (
                <div className="block-editor">
                    <div className="block-editor__toolbar">
                        <FilterControl filter={filter} updateFilter={updateFilter} />
                    </div>
                    <div className="block-editor__body">
                        <CollectionGrid
                            collection={collection}
                            onHit={onHit}
                            setValue={session.setDraft}
                        />
                    </div>
                </div>
            );
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
