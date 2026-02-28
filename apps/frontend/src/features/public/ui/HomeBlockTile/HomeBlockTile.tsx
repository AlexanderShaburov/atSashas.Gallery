// features/public/ui/HomeBlockTile/HomeBlockTile.tsx

import type { Block, CtaBlock, EventCtaBlock, GalleryBlock, TextBlock } from '@/entities/block';
import { useEvent } from '@/shared/EventsProvider/useEvent';
import { useResolveArt } from '@/shared/ArtCatalogProvider/CatalogHook';
import { useState } from 'react';
import { EnrollmentForm } from '@/features/public/ui/EventCta/EnrollmentForm';
import './HomeBlockTile.css';

type Props = {
    block: Block;
    size?: 'S' | 'M' | 'L';
};

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

function EventCtaTile({ block }: { block: EventCtaBlock }) {
    const event = useEvent(block.eventId);
    const resolveArt = useResolveArt();
    const [showForm, setShowForm] = useState(false);

    if (!event) {
        return <div className="hbt__inner hbt__inner--missing">Event not found</div>;
    }

    // Try to find a background art from gallery blocks that reference this event
    // For home tiles, we don't have gallery context so just show without background
    const isClosed = event.status === 'closed';
    const isDraft = event.status === 'draft';
    const canEnroll = !isClosed && !isDraft;
    const isFree = !event.price || event.price.amount <= 0;
    const buttonText = block.buttonLabel?.en ?? (isFree ? 'Book a seat' : 'Join workshop');

    // If the event has a streamSlug, try to find background art from a related gallery
    const bgArt = event.streamSlug ? undefined : undefined;
    void resolveArt; // available for future background art resolution
    void bgArt;

    return (
        <div className={`hbt__inner hbt__inner--event hbt__inner--${event.status}`}>
            <div className="hbt__event-content">
                <header className="hbt__event-header">
                    <span className={`hbt__event-label hbt__event-label--${event.status}`}>
                        {event.status === 'scheduled' ? 'Event' : event.status}
                    </span>
                    <h3 className="hbt__event-title">{event.title.en}</h3>
                </header>

                {event.description?.en && (
                    <p className="hbt__event-desc">{event.description.en}</p>
                )}

                <div className="hbt__event-meta">
                    <span className="hbt__event-meta-item">{formatDate(event.dateTime)}</span>
                    {event.location && (
                        <span className="hbt__event-meta-item">
                            {event.mapUrl ? (
                                <a
                                    href={event.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hbt__event-link"
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
                        <span className="hbt__event-meta-item hbt__event-price">
                            {formatPrice(event.price)}
                        </span>
                    )}
                </div>

                <div className="hbt__event-spacer" />

                <div className="hbt__event-action">
                    <button
                        className="hbt__event-btn"
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

function GalleryTile({ block }: { block: GalleryBlock }) {
    const resolveArt = useResolveArt();

    // Show first art item as background
    const firstArtItem = block.items.find((it) => it.kind === 'art');
    const art = firstArtItem ? resolveArt(firstArtItem.artId) : undefined;
    const hasBg = !!art;

    return (
        <div className={`hbt__inner hbt__inner--gallery${hasBg ? ' hbt__inner--has-bg' : ''}`}>
            {art && (
                <picture className="hbt__gallery-bg">
                    {art.images.preview.avif && (
                        <source type="image/avif" srcSet={art.images.preview.avif} />
                    )}
                    {art.images.preview.webp && (
                        <source type="image/webp" srcSet={art.images.preview.webp} />
                    )}
                    <img src={art.images.preview.jpeg} alt="" draggable={false} />
                </picture>
            )}
            {block.caption?.en && <span className="hbt__gallery-caption">{block.caption.en}</span>}
            {!hasBg && !block.caption?.en && (
                <div className="hbt__inner--missing">Gallery</div>
            )}
        </div>
    );
}

function TextTile({ block }: { block: TextBlock }) {
    const hasContent = !!(block.title?.en || block.body?.en);
    return (
        <div className="hbt__inner hbt__inner--text">
            {block.title?.en && <h3 className="hbt__text-title">{block.title.en}</h3>}
            {block.body?.en && <p className="hbt__text-body">{block.body.en}</p>}
            {!hasContent && <div className="hbt__inner--missing">Text</div>}
        </div>
    );
}

function CtaTile({ block }: { block: CtaBlock }) {
    const href =
        block.target?.type === 'external'
            ? block.target.url
            : block.target?.type === 'stream'
              ? `/gallery/${block.target.slug}`
              : undefined;

    const hasContent = !!(block.title?.en || block.body?.en || block.buttonLabel?.en);

    return (
        <div className="hbt__inner hbt__inner--cta">
            {block.title?.en && <h3 className="hbt__cta-title">{block.title.en}</h3>}
            {block.body?.en && <p className="hbt__cta-body">{block.body.en}</p>}
            {block.buttonLabel?.en && href && (
                <a
                    className="hbt__cta-btn"
                    href={href}
                    target={block.target?.type === 'external' ? '_blank' : undefined}
                    rel={block.target?.type === 'external' ? 'noopener noreferrer' : undefined}
                    onClick={(e) => e.stopPropagation()}
                >
                    {block.buttonLabel.en}
                </a>
            )}
            {!hasContent && <div className="hbt__inner--missing">CTA</div>}
        </div>
    );
}

export function HomeBlockTile({ block, size }: Props) {
    console.log('[HomeBlockTile] Rendering block:', block.id, block.blockKind, block);
    const sizeClass = size === 'L' ? ' hbt--large' : '';

    const inner = (() => {
        switch (block.blockKind) {
            case 'eventCta':
                return <EventCtaTile block={block} />;
            case 'gallery':
                return <GalleryTile block={block} />;
            case 'text':
                return <TextTile block={block} />;
            case 'cta':
                return <CtaTile block={block} />;
            default:
                console.warn('[HomeBlockTile] Unknown blockKind:', block);
                return (
                    <div className="hbt__inner hbt__inner--missing">
                        Block: {(block as { blockKind?: string }).blockKind ?? 'unknown'}
                    </div>
                );
        }
    })();

    return <article className={`hbt${sizeClass}`}>{inner}</article>;
}
