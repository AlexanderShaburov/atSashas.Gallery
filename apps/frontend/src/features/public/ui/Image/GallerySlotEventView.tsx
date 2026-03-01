// features/public/ui/Image/GallerySlotEventView.tsx

import type { GalleryEventItem } from '@/entities/block';
import { useEvent } from '@/shared/EventsProvider/useEvent';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
import { canEnrollEvent, isEventClosed, isEventFree } from '@/shared/lib/checkers/eventStatusHelpers';
import { formatEventDate, formatPrice } from '@/shared/lib/dateAndLabels/formatters';
import { ArtPicture } from '@/shared/ui/ArtPicture';
import { useState } from 'react';
import { EnrollmentForm } from '@/features/public/ui/EventCta/EnrollmentForm';
import './GallerySlotEventView.css';

type Props = { item: GalleryEventItem };

export function GallerySlotEventView({ item }: Props) {
    const event = useEvent(item.eventId);
    const catalog = useArtCatalog();
    const [showForm, setShowForm] = useState(false);

    const bgArt = item.backgroundArtId ? catalog?.items?.[item.backgroundArtId] : undefined;

    if (!event) {
        return (
            <div className="gse gse--missing">
                Event not found
            </div>
        );
    }

    const isClosed = isEventClosed(event);
    const canEnroll = canEnrollEvent(event);
    const isFree = isEventFree(event);
    const buttonText = item.buttonLabel?.en ?? (isFree ? 'Book a seat' : 'Join workshop');

    return (
        <div className={`gse gse--${event.status}`}>
            {bgArt && (
                <ArtPicture
                    className="gse__bg"
                    sources={bgArt.images.preview}
                    draggable={false}
                />
            )}

            <div className="gse__content">
                {/* ── Header zone ── */}
                <header className="gse__header">
                    <span className={`gse__label gse__label--${event.status}`}>
                        {event.status === 'scheduled' ? 'Event' : event.status}
                    </span>
                    <h4 className="gse__title">{event.title.en}</h4>
                </header>

                {/* ── Description zone ── */}
                {event.description?.en && (
                    <p className="gse__desc">{event.description.en}</p>
                )}

                {/* ── Metadata row ── */}
                <div className="gse__meta">
                    <span className="gse__meta-item">
                        🗓 {formatEventDate(event.dateTime)}
                    </span>
                    {event.location && (
                        <span className="gse__meta-item">
                            📍 {event.mapUrl ? (
                                <a
                                    href={event.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="gse__place-link"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {event.location}
                                </a>
                            ) : (
                                event.location
                            )}
                        </span>
                    )}
                    {event.price && event.price.amount > 0 && (
                        <span className="gse__meta-item gse__price">
                            💰 {formatPrice(event.price)}
                        </span>
                    )}
                </div>

                {/* ── Spacer ── */}
                <div className="gse__spacer" />

                {/* ── Action zone ── */}
                <div className="gse__action">
                    <button
                        className="gse__btn"
                        disabled={!canEnroll}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (canEnroll) setShowForm(true);
                        }}
                    >
                        {isClosed ? 'Closed' : buttonText}
                    </button>
                </div>

                {showForm && canEnroll && (
                    <EnrollmentForm
                        eventId={event.id}
                        isFree={isFree}
                        onCancel={() => setShowForm(false)}
                    />
                )}
            </div>
        </div>
    );
}
