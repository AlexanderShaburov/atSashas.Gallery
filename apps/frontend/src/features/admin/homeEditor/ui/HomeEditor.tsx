// features/admin/homeEditor/ui/HomeEditor.tsx
//
// Homepage Editor — singleton edit-only editor at /admin/home.
// Composes a HomeDoc from streamRef + eventRef items. Unresolved
// streamRef / eventRef items route to OrphanTileAdmin; Save is not
// blocked but an attention banner surfaces orphans.
//
// Event pages are resolved against the reactive `eventPagesStore`
// (admin catalog), NOT the public `eventPagesModule`. This keeps the
// editor consistent with the EventPage editor and ensures newly
// authored draft-status pages resolve immediately.

import type { HomeItem } from '@/entities/homeDoc';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { eventPagesStore, streamsIndexStore, useStoreData } from '@/shared/state';
import { useHomeEditorSession } from '../homeEditorSession/HomeEditorSession.context';
import { HomeEventTileAdmin } from './HomeEventTileAdmin';
import { HomeStreamTileAdmin } from './HomeStreamTileAdmin';
import { OrphanTileAdmin } from './OrphanTileAdmin';
import './HomeEditor.css';

function itemKey(item: HomeItem, index: number): string {
    if (item.kind === 'streamRef') return `stream:${item.streamId}`;
    if (item.kind === 'eventRef') return `event:${item.eventPageId}`;
    return `item:${index}`;
}

export function HomeEditor() {
    const session = useHomeEditorSession();
    const {
        homeDoc,
        isLoading,
        isSaving,
        isDirty,
        addStreamViaJourney,
        addEventViaJourney,
        openStreamItem,
        openEventItem,
        removeItem,
        reorderItems,
        save,
        discard,
        preview,
        exit,
    } = session;

    const streamsIndex = useStoreData(streamsIndexStore) ?? [];
    const eventPages = useStoreData(eventPagesStore);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    if (isLoading) {
        return (
            <div className="hea">
                <div className="hea__loading">Loading Homepage…</div>
            </div>
        );
    }

    if (!homeDoc) {
        return (
            <div className="hea">
                <div className="hea__loading">Failed to load Homepage.</div>
            </div>
        );
    }

    const items = homeDoc.items;
    const dndIds = items.map((it, i) => itemKey(it, i));

    // A stream is considered resolved only if it exists in the index AND
    // is not archived. Archived streams are treated as orphans so that
    // `archive_stream` on the backend produces a parity experience with
    // event-page delete (both result in OrphanTileAdmin on the homepage).
    const resolveStream = (streamId: string) => {
        const hit = streamsIndex.find((s) => s.streamId === streamId);
        if (!hit) return undefined;
        if (hit.status === 'archived') return undefined;
        return hit;
    };

    // Orphan count for the attention banner.
    let orphanCount = 0;
    for (const item of items) {
        if (item.kind === 'streamRef') {
            if (!resolveStream(item.streamId)) orphanCount++;
        } else if (item.kind === 'eventRef') {
            if (!eventPages?.pages[item.eventPageId]) orphanCount++;
        }
    }
    const showAttentionBanner = orphanCount > 0;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = dndIds.indexOf(active.id as string);
        const newIndex = dndIds.indexOf(over.id as string);
        if (oldIndex < 0 || newIndex < 0) return;
        reorderItems(arrayMove(items, oldIndex, newIndex));
    };

    return (
        <div className="hea">
            <header className="hea__header">
                <h1 className="hea__title">Homepage</h1>
                <div className="hea__actions">
                    <button type="button" className="hea__btn" onClick={preview}>
                        Preview
                    </button>
                    {isDirty && (
                        <button
                            type="button"
                            className="hea__btn hea__btn--secondary"
                            onClick={discard}
                        >
                            Discard
                        </button>
                    )}
                    <button
                        type="button"
                        className="hea__btn hea__btn--primary"
                        onClick={() => void save()}
                        disabled={!isDirty || isSaving}
                    >
                        {isSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" className="hea__btn" onClick={exit}>
                        Exit
                    </button>
                </div>
            </header>

            {showAttentionBanner && (
                <div className="hea__banner" role="status">
                    <strong>Items need attention.</strong>{' '}
                    {orphanCount} unresolved reference{orphanCount === 1 ? '' : 's'} (marked
                    "Missing"). Saving is allowed — they will be skipped on the public homepage.
                </div>
            )}

            <section className="hea__compose">
                <button
                    type="button"
                    className="hea__btn hea__btn--add"
                    onClick={addStreamViaJourney}
                >
                    + Add Stream
                </button>
                <button
                    type="button"
                    className="hea__btn hea__btn--add"
                    onClick={addEventViaJourney}
                >
                    + Add Event
                </button>
            </section>

            <section className="hea__list-section">
                <h2 className="hea__section-title">
                    Tiles <span className="hea__count">({items.length})</span>
                </h2>
                {items.length === 0 ? (
                    <div className="hea__empty">
                        No tiles yet. Add a stream or event to begin.
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={dndIds} strategy={verticalListSortingStrategy}>
                            <ul className="hea__list">
                                {items.map((item, index) => {
                                    const dndId = dndIds[index]!;

                                    if (item.kind === 'streamRef') {
                                        const resolved = resolveStream(item.streamId);
                                        if (!resolved) {
                                            return (
                                                <li key={dndId}>
                                                    <OrphanTileAdmin
                                                        dndId={dndId}
                                                        kind="stream"
                                                        missingId={item.streamId}
                                                        index={index}
                                                        onRemove={removeItem}
                                                    />
                                                </li>
                                            );
                                        }
                                        return (
                                            <li key={dndId}>
                                                <HomeStreamTileAdmin
                                                    dndId={dndId}
                                                    item={item}
                                                    index={index}
                                                    resolved={resolved}
                                                    onOpen={openStreamItem}
                                                    onRemove={removeItem}
                                                />
                                            </li>
                                        );
                                    }

                                    if (item.kind === 'eventRef') {
                                        const resolved = eventPages?.pages[item.eventPageId];
                                        if (!resolved) {
                                            return (
                                                <li key={dndId}>
                                                    <OrphanTileAdmin
                                                        dndId={dndId}
                                                        kind="event"
                                                        missingId={item.eventPageId}
                                                        index={index}
                                                        onRemove={removeItem}
                                                    />
                                                </li>
                                            );
                                        }
                                        return (
                                            <li key={dndId}>
                                                <HomeEventTileAdmin
                                                    dndId={dndId}
                                                    item={item}
                                                    index={index}
                                                    resolved={resolved}
                                                    onOpen={openEventItem}
                                                    onRemove={removeItem}
                                                />
                                            </li>
                                        );
                                    }

                                    return null;
                                })}
                            </ul>
                        </SortableContext>
                    </DndContext>
                )}
            </section>
        </div>
    );
}
