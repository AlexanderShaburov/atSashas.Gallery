//@/features/admin/blocks/BlockEditor/BlockEditor.tsx
import type { BlockEditorSession } from '@/features/admin/blocks/blockEditorSession';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates';
import { CollectionGrid } from '@/features/admin/blocks/ui/CollectionGrid/CollectionGrid';
import { FilterControl, type BlockFilterState } from '@/features/admin/blocks/ui/FilterControl';
import { SingleBlockEditor } from '@/features/admin/blocks/ui/SingleBlockEditor/SingleBlockEditor';
import {
    applyArtCatalogFilter,
    ArtCatalogFilterControl,
    type ArtCatalogFilterState,
} from '@/features/admin/shared/ui/ArtCatalogFilterControl/';
import ArtItemGrid from '@/features/admin/shared/ui/ArtItemGrid/ArtItemGrid';
import '@/features/admin/shared/ui/BlockPreview/index';
import '@/pages/admin/BlocksPage/BlocksPage.css';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
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
        saving: session.saving,
        save: session.save,
        exit: session.exit,
        onDelete: session.onDelete,
        tags: session.values?.tags,
        onChangeTags: session.updateTags,
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
        setSelectedArtItem,
    } = session;

    const { screenMode, onEscape } = currentStack;
    const catalog = useArtCatalog();

    const [artFilter, setArtFilter] = useState<ArtCatalogFilterState>({
        query: '',
        tags: [],
        technique: undefined,
        availability: undefined,
        series: undefined,
        hasPrice: false,
        extended: false,
    });
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

    const updateArtFilter = (patch: Partial<ArtCatalogFilterState>) => {
        setArtFilter((prev) => ({ ...prev, ...patch }));
    };

    switch (screenMode) {
        case 'edit':
            if (!session.values)
                throw new Error(`[BlockEditor]: Try edit nonexistent block values`);
            return (
                <div className="block-editor">
                    <div className="block-editor__body">
                        <SingleBlockEditor
                            item={session.values}
                            onHit={testHit}
                            setValue={session.setValues}
                            toolbarProps={toolbarProps}
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
                            setValue={session.setValues}
                        />
                    </div>
                </div>
            );
        case 'pickArt': {
            const artCollection = applyArtCatalogFilter(catalog.items, artFilter);
            console.log(`[BlockEditor]: artCollection is: `);
            console.dir(artCollection);
            return (
                <div className="block-editor">
                    <div className="block-editor__toolbar">
                        <ArtCatalogFilterControl
                            items={catalog?.items}
                            filter={artFilter}
                            updateFilter={updateArtFilter}
                            onBack={onEscape}
                        />
                    </div>
                    <div className="block-editor__body">
                        <ArtItemGrid
                            artCollection={artCollection}
                            setIdentity={setSelectedArtItem}
                        />
                    </div>
                </div>
            );
        }
    }
}
