// features/public/ui/Image/GallerySlotEventView.tsx

import type { GalleryEventItem } from '@/entities/block';
import { useEvent } from '@/shared/EventsProvider/useEvent';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
import { useState } from 'react';
import { EnrollmentForm } from '@/features/public/ui/EventCta/EnrollmentForm';
import './GallerySlotEventView.css';

type Props = { item: GalleryEventItem };

function formatDate(iso: string): string {
    const d = new Date(iso);
    const day = d.getDate();
    const month = d.toLocaleDateString('en', { month: 'short' });
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${hours}:${mins}`;
}

function formatPrice(price: { amount: number; currency: string }): string {
    const sym =
        price.currency === 'EUR'
            ? '\u20AC'
            : price.currency === 'USD'
              ? '$'
              : price.currency;
    return `${price.amount}${sym}`;
}

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

    const isClosed = event.status === 'closed';
    const isDraft = event.status === 'draft';
    const canEnroll = !isClosed && !isDraft;
    const isFree = !event.price || event.price.amount <= 0;
    const buttonText = item.buttonLabel?.en ?? (isFree ? 'Book a seat' : 'Join workshop');

    return (
        <div className={`gse gse--${event.status}`}>
            {bgArt && (
                <picture className="gse__bg">
                    {bgArt.images.preview.avif && (
                        <source type="image/avif" srcSet={bgArt.images.preview.avif} />
                    )}
                    {bgArt.images.preview.webp && (
                        <source type="image/webp" srcSet={bgArt.images.preview.webp} />
                    )}
                    <img src={bgArt.images.preview.jpeg} alt="" draggable={false} />
                </picture>
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
                        🗓 {formatDate(event.dateTime)}
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
