// shared/ui/QuickView/QuickView.tsx

import type { ArtItemData } from '@/entities/art';
import { formatPrice } from '@/shared/lib/dateAndLabels/formatters';
import { ArtPicture } from '@/shared/ui/ArtPicture';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './QuickView.css';

type Props = {
    art: ArtItemData;
    anchorRect: DOMRect;
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

export function QuickView({ art, anchorRect, onClose, onViewFull }: Props) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Position the card near the click anchor
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const cardW = Math.min(320, viewportW - 32);
    const cardH = 400; // approximate max height

    let left = anchorRect.left + anchorRect.width / 2 - cardW / 2;
    let top = anchorRect.bottom + 8;

    // Keep within viewport
    if (left < 16) left = 16;
    if (left + cardW > viewportW - 16) left = viewportW - cardW - 16;
    if (top + cardH > viewportH - 16) {
        top = anchorRect.top - cardH - 8;
        if (top < 16) top = 16;
    }

    return createPortal(
        <div className="qv-backdrop" onClick={onClose}>
            <div
                className="qv-card"
                style={{ top, left, width: cardW }}
                onClick={(e) => e.stopPropagation()}
            >
                <ArtPicture
                    className="qv-card__preview"
                    sources={art.images.preview}
                    alt={art.images.alt?.en || art.title?.en || ''}
                />

                <div className="qv-card__info">
                    {art.title?.en && <h3 className="qv-card__title">{art.title.en}</h3>}

                    {art.techniques.length > 0 && (
                        <p className="qv-card__technique">{art.techniques.join(', ')}</p>
                    )}

                    {art.dimensions.width > 0 && (
                        <p className="qv-card__dimensions">{formatDimensions(art.dimensions)}</p>
                    )}

                    {art.price && (
                        <p className="qv-card__price">{formatPrice(art.price)}</p>
                    )}

                    <p className="qv-card__availability">
                        {AVAILABILITY_LABELS[art.availability] ?? art.availability}
                    </p>
                </div>

                <div className="qv-card__actions">
                    <button className="qv-card__btn qv-card__btn--primary" onClick={onViewFull}>
                        View full
                    </button>
                    <button className="qv-card__btn qv-card__btn--secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
