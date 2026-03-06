// shared/ui/QuickView/QuickView.tsx

import type { ArtItemData } from '@/entities/art';
import { formatPrice } from '@/shared/lib/dateAndLabels/formatters';
import { ArtPicture } from '@/shared/ui/ArtPicture';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './QuickView.css';

type Props = {
    art: ArtItemData;
    anchorPoint: { x: number; y: number };
    onClose: () => void;
    onViewFull: () => void;
};

function formatDimensions(d: { width: number; height: number; unit: string }): string {
    return `${d.width} x ${d.height} ${d.unit}`;
}

const AVAILABILITY_LABELS: Record<string, string> = {
    available: 'Available',
    reserved: 'Reserved',
    sold: 'Sold',
    privateCollection: 'Private collection',
    notForSale: 'Not for sale',
};

// Module-level singleton: only one QuickView can be open at a time.
// Stores the close trigger of the currently active instance.
let activeDismiss: (() => void) | null = null;

export function QuickView({ art, anchorPoint, onClose, onViewFull }: Props) {
    const [closing, setClosing] = useState(false);

    const startClose = useCallback(() => {
        setClosing(true);
    }, []);

    // Dismiss any previous QuickView, register this one
    useEffect(() => {
        activeDismiss?.();
        activeDismiss = startClose;
        return () => {
            if (activeDismiss === startClose) activeDismiss = null;
        };
    }, [startClose]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') startClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [startClose]);

    const cardRef = useRef<HTMLDivElement>(null);

    const handleAnimationEnd = () => {
        if (closing) onClose();
    };

    // anchorPoint is page-relative (clientX/Y + scroll at click time)
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const cardW = Math.min(320, viewportW - 32);
    const margin = 16;

    // Initial position: centered on click X, below click Y
    let left = anchorPoint.x - cardW / 2;
    let top = anchorPoint.y + 12;

    // Horizontal clamping
    if (left < scrollX + margin) left = scrollX + margin;
    if (left + cardW > scrollX + viewportW - margin) left = scrollX + viewportW - cardW - margin;

    // Measure actual card height and clamp to visible viewport (before paint)
    useLayoutEffect(() => {
        const card = cardRef.current;
        if (!card) return;
        const cardH = card.offsetHeight;
        const visibleTop = scrollY + margin;
        const visibleBottom = scrollY + viewportH - margin;
        let adjustedTop = anchorPoint.y + 12;

        // If card overflows bottom, try placing it above the click point
        if (adjustedTop + cardH > visibleBottom) {
            adjustedTop = anchorPoint.y - cardH - 12;
        }

        // If it still overflows top, pin to top of visible area
        if (adjustedTop < visibleTop) {
            adjustedTop = visibleTop;
        }

        card.style.top = `${adjustedTop}px`;
    });

    const stateClass = closing ? 'qv--closing' : 'qv--open';

    return createPortal(
        <div className={`qv-backdrop ${stateClass}`} onClick={startClose}>
            <div
                ref={cardRef}
                className={`qv-card ${stateClass}`}
                style={{ top, left, width: cardW }}
                onClick={(e) => e.stopPropagation()}
                onAnimationEnd={handleAnimationEnd}
            >
                <ArtPicture
                    className="qv-card__preview"
                    sources={art.images.preview}
                    alt={art.images.alt?.en || art.title?.en || ''}
                />

                <div className="qv-card__info">
                    {art.title?.en && <h3 className="qv-card__title">{art.title.en}</h3>}

                    {art.notes && (
                        <p className="qv-card__notes">{art.notes}</p>
                    )}

                    {art.techniques && art.techniques.length > 0 && (
                        <p className="qv-card__technique">{art.techniques.join(', ')}</p>
                    )}

                    {art.dimensions && art.dimensions.width > 0 && (
                        <p className="qv-card__dimensions">{formatDimensions(art.dimensions)}</p>
                    )}

                    {art.price && (
                        <p className="qv-card__price">{formatPrice(art.price)}</p>
                    )}

                    {art.availability && (
                        <p className="qv-card__availability">
                            {AVAILABILITY_LABELS[art.availability] ?? art.availability}
                        </p>
                    )}
                </div>

                <div className="qv-card__actions">
                    <button className="qv-card__btn qv-card__btn--primary" onClick={onViewFull}>
                        View full
                    </button>
                    <button className="qv-card__btn qv-card__btn--secondary" onClick={startClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
