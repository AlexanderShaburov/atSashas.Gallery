// features/admin/shared/ui/BlockPreview/GalleryEventSlot.tsx

import type { GalleryEventItem } from '@/entities/block';
import { useEvent } from '@/shared/EventsProvider/useEvent';

type Props = {
    item: GalleryEventItem;
    isEditor: boolean;
    onPickEvent: () => void;
    onPickBackground: () => void;
    resolvedBgSrc?: string;
};

export function GalleryEventSlot({
    item,
    isEditor,
    onPickEvent,
    onPickBackground,
    resolvedBgSrc,
}: Props) {
    const event = useEvent(item.eventId);

    return (
        <div className="blk-gallery__event-card">
            {resolvedBgSrc && (
                <img
                    className="blk-gallery__event-bg"
                    src={resolvedBgSrc}
                    alt=""
                    draggable={false}
                />
            )}
            <div className="blk-gallery__event-content">
                {event ? (
                    <>
                        <div className="blk-gallery__event-title">{event.title.en}</div>
                        <div className="blk-gallery__event-meta">
                            <span>{new Date(event.dateTime).toLocaleDateString()}</span>
                            <span className="blk-gallery__event-status">{event.status}</span>
                        </div>
                    </>
                ) : (
                    <div className="blk-gallery__event-empty">
                        {item.eventId ? `Event: ${item.eventId}` : 'No event selected'}
                    </div>
                )}
                {isEditor && (
                    <div className="blk-gallery__event-controls">
                        <button
                            className="blk-gallery__event-pick-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPickEvent();
                            }}
                        >
                            {event ? `Event: ${event.title.en}` : 'Select Event'}
                        </button>
                        <button
                            className="blk-gallery__event-pick-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPickBackground();
                            }}
                        >
                            {item.backgroundArtId ? 'Change Background' : 'Select Background'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
