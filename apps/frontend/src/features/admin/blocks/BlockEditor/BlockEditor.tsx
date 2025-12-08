//@/features/admin/blocks/BlockEditor/BlockEditor.tsx
import type { BlockEditorSession } from '@/features/admin/blocks/editorSession';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import '@/features/admin/blocks/ui/BlockPreview/index';
import { BlockHitEvent } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
import { CollectionGrid } from '@/features/admin/blocks/ui/CollectionGrid/CollectionGrid';
import { CollectionSelector } from '@/features/admin/blocks/ui/CollectionSelector/CollectionSelector';
import { BlockModeTag } from '@/features/admin/blocks/ui/TagsPanel/BlockModeTag';
import '@/pages/admin/BlocksPage/BlocksPage.css';

export function BlockEditor() {
    const session: BlockEditorSession = useBlockEditorSession();

    const {
        collectionsList,
        collection,
        mode,
        identity,
        loading,
        saving,
        isDirty,
        isValid,
        canSave,
        save,
        exit,
        removeCollection,
    } = session;

    // Current collection is stored in workspace context
    const selectedCollection = session.collection;

    function onHit(hit: BlockHitEvent) {
        console.dir(`Hit occur ${hit}`);
    }
    const handleDelete = async () => {
        if (!collection) return;
        const confirmed = window.confirm(
            `Delete collection «${collection.collectionName ?? collection.collectionId}»? This action is irreversible.`,
        );
        if (!confirmed) return;
        await removeCollection(collection);
    };

    return (
        <div className="block-editor">
            {/* Top toolbar: collection + mode tag + save/exit */}
            <div className="block-editor__toolbar">
                <div className="block-editor__toolbar-left">
                    <CollectionSelector
                        collections={collectionsList}
                        selectedId={selectedCollection?.collectionId}
                        loading={loading}
                    />
                </div>

                <div className="block-editor__toolbar-center">
                    <BlockModeTag
                        mode={mode}
                        dirty={isDirty}
                        valid={isValid}
                        saving={saving}
                        hasIdentity={!!identity}
                    />
                </div>

                <div className="block-editor__toolbar-right">
                    {collection && (
                        <div>
                            <button
                                type="button"
                                className="block-editor__btn block-editor__btn--delete"
                                disabled={saving}
                                onClick={handleDelete}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                    <button
                        type="button"
                        className="block-editor__btn block-editor__btn--primary"
                        disabled={!canSave}
                        onClick={() => void save()}
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                        type="button"
                        className="block-editor__btn"
                        disabled={saving}
                        onClick={exit}
                    >
                        {mode === 'create' ? 'Cancel' : 'Close'}
                    </button>
                </div>
            </div>

            <div className="block-editor__body">
                {loading && <p className="block-editor__status">Loading collections…</p>}

                {!loading && !selectedCollection && (
                    <p className="block-editor__status">
                        Choose a blocks collection above to start editing.
                    </p>
                )}

                {collection && <CollectionGrid collection={collection} onHit={onHit} />}
            </div>
        </div>
    );
}
