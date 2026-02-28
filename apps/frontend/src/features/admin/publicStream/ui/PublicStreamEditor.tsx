// features/admin/publicStream/ui/PublicStreamEditor.tsx

import type { Block } from '@/entities/block';
import type { HomeItem } from '@/entities/homeDoc';
import type { StreamIndexItem } from '@/entities/stream';
import { usePublicStreamSession } from '../publicStreamSession/PublicStreamSession.context';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './PublicStreamEditor.css';

// ── Unique key for a HomeItem (used by dnd-kit) ──
function itemKey(item: HomeItem, index: number): string {
    if (item.kind === 'streamRef') return `stream:${item.streamSlug}`;
    if (item.kind === 'blockRef') return `block:${item.blockId}`;
    return `item:${index}`;
}

// ── Resolve display info for a HomeItem ──
function useResolvedItem(
    item: HomeItem,
    allStreams: StreamIndexItem[],
    allBlocks: Block[],
): { title: string; thumbnail?: string; badge: string; badgeClass: string } {
    if (item.kind === 'streamRef') {
        const stream = allStreams.find((s) => s.streamId === item.streamSlug);
        return {
            title: stream?.title ?? item.streamSlug,
            thumbnail: item.thumbOverrideUrl ?? stream?.thumbnail,
            badge: 'Stream',
            badgeClass: 'pse__badge--stream',
        };
    }
    if (item.kind === 'blockRef') {
        const block = allBlocks.find((b) => b.id === item.blockId);
        const title =
            (block && 'title' in block && block.title?.en) ||
            block?.caption?.en ||
            item.blockId;
        return {
            title,
            badge: block?.blockKind ?? 'Block',
            badgeClass: 'pse__badge--block',
        };
    }
    return { title: 'Unknown', badge: '?', badgeClass: '' };
}

// ── Sortable item component ──
function SortableHomeItem({
    item,
    index,
    dndId,
    allStreams,
    allBlocks,
    onRemove,
    onSizeChange,
}: {
    item: HomeItem;
    index: number;
    dndId: string;
    allStreams: StreamIndexItem[];
    allBlocks: Block[];
    onRemove: (index: number) => void;
    onSizeChange: (index: number, size: 'S' | 'M' | 'L') => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: dndId,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const resolved = useResolvedItem(item, allStreams, allBlocks);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="pse__stream-item pse__stream-item--public pse__stream-item--draggable"
        >
            <div className="pse__drag-handle" {...attributes} {...listeners}>
                &#x22EE;&#x22EE;
            </div>
            {resolved.thumbnail && (
                <img
                    src={resolved.thumbnail}
                    alt={resolved.title}
                    className="pse__stream-thumbnail"
                />
            )}
            <div className="pse__stream-info">
                <h3 className="pse__stream-title">{resolved.title}</h3>
                <div className="pse__stream-meta">
                    <span className={`pse__badge ${resolved.badgeClass}`}>{resolved.badge}</span>
                    {' '}
                    <select
                        className="pse__size-select"
                        value={item.size ?? 'M'}
                        onChange={(e) =>
                            onSizeChange(index, e.target.value as 'S' | 'M' | 'L')
                        }
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                    </select>
                </div>
            </div>
            <div className="pse__stream-actions">
                <button
                    className="pse__icon-btn pse__icon-btn--danger"
                    onClick={() => onRemove(index)}
                    title="Remove"
                >
                    &#x2715;
                </button>
            </div>
        </div>
    );
}

export function PublicStreamEditor() {
    const session = usePublicStreamSession();
    const {
        homeDoc,
        availableBlocks,
        isLoading,
        isSaving,
        isDirty,
        addStream,
        addBlockViaJourney,
        removeItem,
        reorderItems,
        setItemSize,
        save,
        discard,
        preview,
        nonPublicStreams,
    } = session;

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const items = homeDoc?.items ?? [];
    const allStreams = session.availableStreams;
    const allBlocks = availableBlocks;

    // dnd-kit IDs
    const dndIds = items.map((item, index) => itemKey(item, index));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = dndIds.indexOf(active.id as string);
            const newIndex = dndIds.indexOf(over.id as string);
            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(items, oldIndex, newIndex);
                reorderItems(newOrder);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="pse">
                <div className="pse__loading">Loading Home Composer...</div>
            </div>
        );
    }

    if (!homeDoc) {
        return (
            <div className="pse">
                <div className="pse__loading">Failed to load Home Composer</div>
            </div>
        );
    }

    return (
        <div className="pse">
            <div className="pse__header">
                <h1 className="pse__title">Home Composer</h1>
                <div className="pse__actions">
                    <button
                        className="pse__btn pse__btn--preview"
                        onClick={preview}
                        title="Preview public home in new tab"
                    >
                        Preview
                    </button>
                    {isDirty && (
                        <button className="pse__btn pse__btn--secondary" onClick={discard}>
                            Discard
                        </button>
                    )}
                    <button
                        className="pse__btn pse__btn--primary"
                        onClick={() => void save()}
                        disabled={!isDirty || isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="pse__content">
                {/* Left panel: Home Tiles (current items) */}
                <div className="pse__section">
                    <div className="pse__section-header">
                        <h2 className="pse__section-title">
                            Home Tiles
                            <span className="pse__count">({items.length})</span>
                        </h2>
                    </div>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="pse__list">
                            {items.length === 0 ? (
                                <div className="pse__empty">
                                    No tiles yet. Add streams or blocks from the right panel.
                                </div>
                            ) : (
                                <SortableContext
                                    items={dndIds}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {items.map((item, index) => (
                                        <SortableHomeItem
                                            key={dndIds[index]}
                                            item={item}
                                            index={index}
                                            dndId={dndIds[index]!}
                                            allStreams={allStreams}
                                            allBlocks={allBlocks}
                                            onRemove={removeItem}
                                            onSizeChange={setItemSize}
                                        />
                                    ))}
                                </SortableContext>
                            )}
                        </div>
                    </DndContext>
                </div>

                {/* Right panel: Add Stream + Add Block button */}
                <div className="pse__section">
                    {/* Add Block via Journey */}
                    <div className="pse__section-header">
                        <h2 className="pse__section-title">Add Block</h2>
                    </div>
                    <div className="pse__add-block-panel">
                        <p className="pse__add-block-desc">
                            Open the block editor to select an existing block or create a new one.
                        </p>
                        <button
                            className="pse__btn pse__btn--block-journey"
                            onClick={addBlockViaJourney}
                        >
                            + Add Block
                        </button>
                    </div>

                    {/* Add Stream sub-section */}
                    <div className="pse__section-header" style={{ marginTop: '1.5rem' }}>
                        <h2 className="pse__section-title">
                            Add Stream
                            <span className="pse__count">({nonPublicStreams.length})</span>
                        </h2>
                    </div>
                    <div className="pse__list">
                        {nonPublicStreams.length === 0 ? (
                            <div className="pse__empty">All ready streams are already added.</div>
                        ) : (
                            nonPublicStreams.map((stream) => (
                                <div key={stream.streamId} className="pse__stream-item">
                                    {stream.thumbnail && (
                                        <img
                                            src={stream.thumbnail}
                                            alt={stream.title}
                                            className="pse__stream-thumbnail"
                                        />
                                    )}
                                    <div className="pse__stream-info">
                                        <h3 className="pse__stream-title">{stream.title}</h3>
                                        <div className="pse__stream-meta">{stream.status}</div>
                                    </div>
                                    <div className="pse__stream-actions">
                                        <button
                                            className="pse__icon-btn"
                                            onClick={() => addStream(stream.streamId)}
                                            title="Add to home"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
