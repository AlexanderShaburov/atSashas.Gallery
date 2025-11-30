// src/features/admin/blocks/BlockEditor/CollectionSelector.tsx

import { useState } from 'react';
import type { CollectionsList } from '@/entities/block';

import { getCollection, createCollection } from '@/features/admin/blocks/api/blocksApi';
import { useBlockEditorSession } from '@/features/admin/blocks/editorSessionContext/BlockEditorSession.context';
import type { BlockEditorSession } from '@/features/admin/blocks/editorSessionContext/blockEditorTypes';

type Props = {
    collections: CollectionsList | undefined;
    selectedId: string | undefined | null;
    loading: boolean;
};

export function CollectionSelector({ collections, selectedId, loading }: Props) {
    const session = useBlockEditorSession() as BlockEditorSession;

    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    const handleChange: React.ChangeEventHandler<HTMLSelectElement> = async (e) => {
        const value = e.target.value || null;
        if (!value) return;

        const c = await getCollection(value);
        session.setCollection(c);
    };

    const handleCreate = async () => {
        const name = newName.trim();
        if (!name) return;

        setCreateLoading(true);
        try {
            // Backend должен создать BlocksCollectionJSON:
            // { collectionId, collectionName, version, updatedAt, blocks: [] }
            const created = await createCollection({ collectionName: name });

            // переключаемся на только что созданную коллекцию
            session.setCollection(created);

            // сбрасываем UI
            setNewName('');
            setIsCreating(false);
        } finally {
            setCreateLoading(false);
        }
    };

    const disabledSelect = loading || !collections || collections.length === 0;

    return (
        <div className="collection-selector">
            <label className="collection-selector__label">
                Collection:
                <select
                    className="collection-selector__select"
                    value={selectedId ?? ''}
                    onChange={handleChange}
                    disabled={disabledSelect}
                >
                    <option value="">— choose —</option>
                    {collections?.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </label>

            <button
                type="button"
                className="collection-selector__add-btn"
                onClick={() => setIsCreating((v) => !v)}
                disabled={loading}
                title="Create collection"
            >
                +
            </button>

            {isCreating && (
                <div className="collection-selector__form">
                    <input
                        className="collection-selector__input"
                        placeholder="Collection name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />

                    <div className="collection-selector__form-actions">
                        <button
                            type="button"
                            className="collection-selector__create-btn"
                            onClick={handleCreate}
                            disabled={!newName.trim() || createLoading}
                        >
                            {createLoading ? 'Creating…' : 'Create'}
                        </button>

                        <button
                            type="button"
                            className="collection-selector__cancel-btn"
                            onClick={() => {
                                setIsCreating(false);
                                setNewName('');
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
