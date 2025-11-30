// src/features/admin/blocks/BlockEditor/BlockEditor.tsx

import { useMemo } from 'react';

import type { BlockKind } from '@/entities/block';
import type { BlockEditorSession } from '@/features/admin/blocks/editorSessionContext';
import { useBlockEditorSession } from '@/features/admin/blocks/editorSessionContext/BlockEditorSession.context';
import { createInitialFormForKind } from '@/features/admin/blocks/editorSessionContext/blockFormValueTypes';
import '@/pages/admin/BlocksPage/BlocksPage.css';
import { BlockKindSelector } from './BlockKindSelector';
import { BlockModeTag } from './BlockModeTag';
import { CollectionSelector } from './CollectionSelector';
import { SingleBlockEditor } from './SingleBlockEditor';
export function BlockEditor() {
    const session: BlockEditorSession = useBlockEditorSession();

    const {
        collectionsList,
        mode,
        identity,
        values,
        setValues,
        loading,
        saving,
        isDirty,
        isValid,
        canSave,
        save,
        exit,
    } = session;

    // Current collection is stored in workspace context
    const selectedCollection = session.collection;

    // Current block kind taken from form (for create mode)
    const currentKind: BlockKind | undefined = useMemo(
        () => (values?.blockKind as BlockKind | undefined) ?? undefined,
        [values],
    );

    const editorAvailable = !!selectedCollection && !loading;

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

                {editorAvailable && (
                    <>
                        {mode === 'create' && (
                            <section className="block-editor__section block-editor__section--kind">
                                <h2 className="block-editor__section-title">Block kind</h2>
                                <BlockKindSelector
                                    value={currentKind}
                                    onChange={(nextKind) =>
                                        setValues((prev) =>
                                            createInitialFormForKind(nextKind, prev),
                                        )
                                    }
                                />
                            </section>
                        )}

                        <section className="block-editor__section block-editor__section--editor">
                            <SingleBlockEditor />
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
