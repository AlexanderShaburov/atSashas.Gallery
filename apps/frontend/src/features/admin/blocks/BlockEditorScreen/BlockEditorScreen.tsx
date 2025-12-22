//@/features/admin/blocks/BlockEditor/BlockEditor.tsx
import { BlockKind } from '@/entities/block';
import { CtaTypes, GalleryLayout } from '@/entities/block/block.types';
import type { BlockEditorSession } from '@/features/admin/blocks/editorSession';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import '@/features/admin/blocks/ui/BlockPreview/index';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
import { CollectionGrid } from '@/features/admin/blocks/ui/CollectionGrid/CollectionGrid';
import { FilterControl } from '@/features/admin/blocks/ui/FilterControl/FilterControl';
import '@/pages/admin/BlocksPage/BlocksPage.css';
import { useState } from 'react';
import { SingleBlockEditor } from '../ui/SingleBlockEditor/SingleBlockEditor';

export type BlockFilterState = {
    tags: string[];
    kind?: BlockKind;
    layout?: GalleryLayout;
    ctaType?: CtaTypes;
    artName?: string;
    extended: boolean;
};
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
        // mode,
        // identity,
        loading,
        // saving,
        // isDirty,
        // isValid,
        // canSave,
        // save,
        // exit,
        // removeCollection,
    } = session;

    function onHit(hit: BlockHitEvent) {
        console.dir(`Hit occur ${hit}`);
        console.dir(hit);
        session.onHit(hit);
    }

    return (
        <div className="block-editor">
            {/* Top toolbar: collection + mode tag + save/exit */}
            <div className="block-editor__toolbar">
                <FilterControl filter={filter} updateFilter={updateFilter} />
            </div>

            <div className="block-editor__body">
                {loading && <p className="block-editor__status">Loading collections…</p>}

                {session.screenMode === 'select' && (
                    <CollectionGrid collection={collection} onHit={onHit} />
                )}
                {session.screenMode === 'edit' && session.values && (
                    <SingleBlockEditor
                        item={session.values}
                        onHit={session.onHit}
                        setValue={session.setValues}
                        toolbarProps={toolbarProps}
                    />
                )}
            </div>
        </div>
    );
}
