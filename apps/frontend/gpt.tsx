// src/pages/admin/blocks.page.tsx

import { useState } from 'react';
import type { Block } from '@/entities/block';
import './BlocksPage.css';

type Mode = 'create' | 'edit';

// We duplicate layout keys locally to avoid touching Block.ts for now
const GALLERY_LAYOUTS = [
    'single',
    'pairHorizontal',
    'pairVertical',
    'triptychLeft',
    'triptychRight',
    'triptychHorizontal',
] as const;

type GalleryLayoutKey = (typeof GALLERY_LAYOUTS)[number];

interface BlockDraft {
    layout: GalleryLayoutKey | null;
    tags: string[];
    // In future we can also keep selected artIds here
}

export default function BlocksPage() {
    const [mode, setMode] = useState<Mode>('create');

    // Local draft for "Create block" mode
    const [draft, setDraft] = useState<BlockDraft>({
        layout: null,
        tags: [],
    });

    // Placeholder for "Edit" mode
    const [blocks] = useState<Block[]>([]); // TODO: load from backend
    const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

    return (
        <div className="blocks-page">
            <header className="blocks-page__header">
                <h1 className="blocks-page__title">Blocks</h1>

                <div className="blocks-page__mode-switch">
                    <button
                        type="button"
                        className={
                            'blocks-page__mode-btn' +
                            (mode === 'create' ? ' blocks-page__mode-btn--active' : '')
                        }
                        onClick={() => setMode('create')}
                    >
                        Create
                    </button>
                    <button
                        type="button"
                        className={
                            'blocks-page__mode-btn' +
                            (mode === 'edit' ? ' blocks-page__mode-btn--active' : '')
                        }
                        onClick={() => setMode('edit')}
                    >
                        Edit
                    </button>
                </div>
            </header>

            {mode === 'create' ? (
                <CreateBlockLayout
                    draft={draft}
                    onChangeDraft={setDraft}
                    // Later: onSave, openCatalog etc.
                />
            ) : (
                <EditBlocksLayout
                    blocks={blocks}
                    selected={selectedBlock}
                    onSelect={setSelectedBlock}
                />
            )}
        </div>
    );
}

// ----------------------
// Create mode layout
// ----------------------

interface CreateBlockLayoutProps {
    draft: BlockDraft;
    onChangeDraft: (next: BlockDraft) => void;
}

function CreateBlockLayout({ draft, onChangeDraft }: CreateBlockLayoutProps) {
    return (
        <div className="blocks-page__body blocks-page__body--create">
            {/* Left column: Layout palette */}
            <aside className="blocks-page__column blocks-page__column--palette">
                <h2 className="blocks-page__column-title">Layout</h2>

                <p className="blocks-page__hint">
                    Choose a block layout. Click on a frame in the preview to assign an image from
                    catalog (later).
                </p>

                <div className="layout-palette">
                    {GALLERY_LAYOUTS.map((layout) => (
                        <LayoutIcon
                            key={layout}
                            layout={layout}
                            active={draft.layout === layout}
                            onSelect={() =>
                                onChangeDraft({
                                    ...draft,
                                    layout,
                                })
                            }
                        />
                    ))}
                </div>
            </aside>

            {/* Center: block preview + meta */}
            <main className="blocks-page__column blocks-page__column--preview">
                <h2 className="blocks-page__column-title">Preview</h2>

                <BlockPreview draft={draft} />

                <section className="blocks-page__section">
                    <h3 className="blocks-page__section-title">Tags</h3>
                    <TagsInput
                        value={draft.tags}
                        onChange={(tags) => onChangeDraft({ ...draft, tags })}
                    />
                </section>

                <section className="blocks-page__section blocks-page__section--meta">
                    <div className="blocks-page__meta-row">
                        <span className="blocks-page__meta-label">Date created</span>
                        {/* Later: use server date; here just UI placeholder */}
                        <span className="blocks-page__meta-value">will be set automatically</span>
                    </div>
                </section>

                <div className="blocks-page__actions">
                    <button
                        type="button"
                        className="blocks-page__primary-btn"
                        // TODO: hook up save handler
                        disabled={!draft.layout}
                    >
                        Save block
                    </button>
                    <button
                        type="button"
                        className="blocks-page__ghost-btn"
                        onClick={() =>
                            onChangeDraft({
                                layout: null,
                                tags: [],
                            })
                        }
                    >
                        Reset
                    </button>
                </div>
            </main>

            {/* Right: catalog placeholder with filters */}
            <aside className="blocks-page__column blocks-page__column--catalog">
                <h2 className="blocks-page__column-title">Catalog</h2>

                <CatalogFilterBar />
                <CatalogGridPlaceholder />
            </aside>
        </div>
    );
}

// ----------------------
// Edit mode layout
// ----------------------

interface EditBlocksLayoutProps {
    blocks: Block[];
    selected: Block | null;
    onSelect: (b: Block | null) => void;
}

function EditBlocksLayout({ blocks, selected, onSelect }: EditBlocksLayoutProps) {
    return (
        <div className="blocks-page__body blocks-page__body--edit">
            <section className="blocks-page__column blocks-page__column--list">
                <h2 className="blocks-page__column-title">Existing blocks</h2>

                {blocks.length === 0 ? (
                    <p className="blocks-page__empty">
                        No blocks yet. Create one on the Create tab.
                    </p>
                ) : (
                    <ul className="blocks-list">
                        {blocks.map((b) => (
                            <li
                                key={b.id}
                                className={
                                    'blocks-list__item' +
                                    (selected?.id === b.id ? ' blocks-list__item--active' : '')
                                }
                                onClick={() => onSelect(b)}
                            >
                                <div className="blocks-list__title">
                                    {b.kind} · {b.id}
                                </div>
                                <div className="blocks-list__meta">
                                    {/* TODO: show tags and dateCreated when wired */}
                                    <span>tags: {b.tags?.join(', ') || '—'}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="blocks-page__column blocks-page__column--preview">
                <h2 className="blocks-page__column-title">Block details</h2>

                {selected ? (
                    <>
                        {/* Later: real preview component reusing BlockPreview */}
                        <pre className="blocks-page__json">{JSON.stringify(selected, null, 2)}</pre>

                        <div className="blocks-page__actions">
                            <button
                                type="button"
                                className="blocks-page__primary-btn"
                                // TODO: open in "edit" mode
                            >
                                Edit block
                            </button>
                            <button
                                type="button"
                                className="blocks-page__danger-btn"
                                // TODO: delete handler with confirmation
                            >
                                Delete block
                            </button>
                        </div>
                    </>
                ) : (
                    <p className="blocks-page__empty">Select a block on the left to see details.</p>
                )}
            </section>
        </div>
    );
}

// ----------------------
// Small UI pieces
// ----------------------

interface LayoutIconProps {
    layout: GalleryLayoutKey;
    active: boolean;
    onSelect: () => void;
}

function LayoutIcon({ layout, active, onSelect }: LayoutIconProps) {
    return (
        <button
            type="button"
            className={
                'layout-icon layout-icon--' + layout + (active ? ' layout-icon--active' : '')
            }
            onClick={onSelect}
        >
            <div className="layout-icon__preview">
                <div className="layout-icon__slots layout-icon__slots--single" />
                {/* Real geometry is in CSS via modifiers */}
            </div>
            <div className="layout-icon__label">{layout}</div>
        </button>
    );
}

interface BlockPreviewProps {
    draft: BlockDraft;
}

function BlockPreview({ draft }: BlockPreviewProps) {
    if (!draft.layout) {
        return (
            <div className="block-preview block-preview--empty">Select a layout on the left</div>
        );
    }

    return (
        <div className="block-preview">
            <div className={'block-preview__frame block-preview__frame--' + draft.layout}>
                {/* 
                  Later: each slot becomes clickable area that opens catalog
                  Now it is just a visual placeholder 
                */}
                <div className="block-preview__slots" />
            </div>
        </div>
    );
}

interface TagsInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
}

function TagsInput({ value, onChange }: TagsInputProps) {
    const joined = value.join(', ');

    return (
        <div className="tags-input">
            <input
                className="tags-input__field"
                type="text"
                value={joined}
                placeholder="comma, separated, tags"
                onChange={(e) => {
                    const raw = e.target.value;
                    const parts = raw
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean);
                    onChange(parts);
                }}
            />
            <p className="tags-input__hint">
                Tags will be used later to filter blocks and catalog.
            </p>
        </div>
    );
}

function CatalogFilterBar() {
    // Later: keep filters in context + localStorage
    return (
        <div className="catalog-filters">
            <input
                className="catalog-filters__search"
                type="text"
                placeholder="Search by title / tags"
            />
            <div className="catalog-filters__row">
                <label className="catalog-filters__label">
                    From
                    <input className="catalog-filters__date" type="date" />
                </label>
                <label className="catalog-filters__label">
                    To
                    <input className="catalog-filters__date" type="date" />
                </label>
            </div>
            <button
                type="button"
                className="catalog-filters__reset"
                // TODO: real reset logic
            >
                Reset filters
            </button>
        </div>
    );
}

function CatalogGridPlaceholder() {
    return (
        <div className="catalog-grid-placeholder">
            {/* 
              Later here we reuse catalog grid (ArtItem thumbnails) and on click
              we will assign artId into current slot of draft layout 
            */}
            <p className="catalog-grid-placeholder__hint">
                Here will be catalog grid with images and persistent filters.
            </p>
        </div>
    );
}
