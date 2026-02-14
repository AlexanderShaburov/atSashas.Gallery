// features/admin/shared/ui/BlockPreview/GalleryEventSlot.tsx

import type { ArtItemData } from '@/entities/art';
import type { GalleryEventItem } from '@/entities/block';
import { useEvent } from '@/shared/EventsProvider/useEvent';
import { useContext, useMemo } from 'react';
import { EventsContext } from '@/shared/EventsProvider/EventsProvider';

type Props = {
    item: GalleryEventItem;
    isEditor: boolean;
    onChangeEvent: (eventId: string) => void;
    onChangeBackground: (artId: string) => void;
    artItems?: ArtItemData[];
    resolvedBgSrc?: string;
};

export function GalleryEventSlot({
    item,
    isEditor,
    onChangeEvent,
    onChangeBackground,
    artItems,
    resolvedBgSrc,
}: Props) {
    const event = useEvent(item.eventId);
    const catalog = useContext(EventsContext);

    const events = useMemo(
        () => (catalog ? Object.values(catalog.events) : []),
        [catalog],
    );

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
                        {item.eventId ? `Event: ${item.eventId}` : 'Select event'}
                    </div>
                )}
                {isEditor && (
                    <div className="blk-gallery__event-controls">
                        <select
                            className="blk-gallery__event-select"
                            value={item.eventId || ''}
                            onChange={(e) => onChangeEvent(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="">Select event...</option>
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.title.en || ev.id} ({ev.status})
                                </option>
                            ))}
                        </select>
                        {artItems && (
                            <select
                                className="blk-gallery__event-select"
                                value={item.backgroundArtId || ''}
                                onChange={(e) => onChangeBackground(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="">Background...</option>
                                {artItems.map((art) => (
                                    <option key={art.id} value={art.id}>
                                        {art.title?.en || art.id}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
