import React, { useState, useMemo } from 'react';

import {
    BlockKind,
    BlockEditorMode,
    GalleryLayoutKind,
    BlockCollectionSummary,
    BlockEditorTarget,
} from '@/entities/block'; // если вынесешь в отдельный файл

// Заглушки под реальные компоненты — см. ниже
import { CollectionSelector } from './CollectionSelector';
import { BlockModeToggle } from './BlockModeToggle';
import { BlockKindSelector } from './BlockKindSelector';
import { GalleryLayoutPicker } from './GalleryLayoutPicker';
import { SingleBlockEditor } from './SingleBlockEditor';

export function BlockEditorPage() {
    // In real code collections will come from API / context
    const [collections] = useState<BlockCollectionSummary[]>([]);

    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [mode, setMode] = useState<BlockEditorMode>('create');
    const [blockKind, setBlockKind] = useState<BlockKind | null>(null);
    const [galleryLayout, setGalleryLayout] = useState<GalleryLayoutKind | null>(null);

    const [target, setTarget] = useState<BlockEditorTarget | null>(null);

    // When we are in "setup" mode: target is not chosen yet
    const isSetupPhase = target === null;

    // Create "ready to start editing" target for create mode
    const createTarget = useMemo((): BlockEditorTarget | null => {
        if (!selectedCollectionId) return null;
        if (!blockKind) return null;

        if (mode === 'edit') {
            // For edit mode we will build target based on selected block
            return null;
        }

        if (blockKind === 'gallery') {
            if (!galleryLayout) return null;
            return {
                mode: 'create',
                collectionId: selectedCollectionId,
                kind: 'gallery',
                layout: galleryLayout,
            };
        }

        // For text / cta we do not need layout
        return {
            mode: 'create',
            collectionId: selectedCollectionId,
            kind: blockKind,
        };
    }, [selectedCollectionId, blockKind, galleryLayout, mode]);

    // Handler when user picks some existing block to edit
    function handleSelectExistingBlock(blockId: string) {
        if (!selectedCollectionId) return;
        const t: BlockEditorTarget = {
            mode: 'edit',
            collectionId: selectedCollectionId,
            blockId,
        };
        setTarget(t);
    }

    // When user clicks "Start editing" in create mode
    function handleStartCreate() {
        if (!createTarget) return;
        setTarget(createTarget);
    }

    // When user exits from SingleBlockEditor (back to setup)
    function handleExitEditor() {
        setTarget(null);
        // You may or may not want to reset kind/layout here
        // setBlockKind(null);
        // setGalleryLayout(null);
    }

    // ---------- RENDER ----------

    return (
        <div className="BlockEditorPage">
            <header className="BlockEditorPage__header">
                <h1>Block editor</h1>
            </header>

            <main className="BlockEditorPage__body">
                {isSetupPhase ? (
                    <div className="BlockEditorPage__setup">
                        <section className="BlockEditorPage__section">
                            <h2>Collection</h2>
                            <CollectionSelector
                                collections={collections}
                                value={selectedCollectionId}
                                onChange={setSelectedCollectionId}
                                onCreateNew={(collection) => {
                                    // In real code this will come from API response
                                    // Here we only select new collection id
                                    setSelectedCollectionId(collection.id);
                                }}
                            />
                        </section>

                        <section className="BlockEditorPage__section">
                            <h2>Mode</h2>
                            <BlockModeToggle value={mode} onChange={setMode} />
                        </section>

                        {mode === 'create' && (
                            <>
                                <section className="BlockEditorPage__section">
                                    <h2>Block kind</h2>
                                    <BlockKindSelector value={blockKind} onChange={setBlockKind} />
                                </section>

                                {blockKind === 'gallery' && (
                                    <section className="BlockEditorPage__section">
                                        <h2>Gallery layout</h2>
                                        <GalleryLayoutPicker
                                            value={galleryLayout}
                                            onChange={setGalleryLayout}
                                        />
                                    </section>
                                )}

                                <section className="BlockEditorPage__section BlockEditorPage__section--actions">
                                    <button
                                        type="button"
                                        disabled={!createTarget}
                                        onClick={handleStartCreate}
                                    >
                                        Start editing block
                                    </button>
                                </section>
                            </>
                        )}

                        {mode === 'edit' && (
                            <section className="BlockEditorPage__section">
                                <h2>Select block to edit</h2>
                                {/* Заглушка: список блоков коллекции.
                   По выбору вызываем handleSelectExistingBlock */}
                                {/* <BlockListForCollection
                     collectionId={selectedCollectionId}
                     onSelect={handleSelectExistingBlock}
                   /> */}
                            </section>
                        )}
                    </div>
                ) : (
                    <div className="BlockEditorPage__editor">
                        <SingleBlockEditor target={target} onExit={handleExitEditor} />
                    </div>
                )}
            </main>
        </div>
    );
}
