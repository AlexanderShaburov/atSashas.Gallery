import type { ReactNode } from 'react';
import { useEffect } from 'react';

import type { ArtItemData } from '@/entities/art';
import type { GalleryBlock, ItemPosition } from '@/entities/block';
import { LAYOUT_SCHEME } from '@/entities/block';
import {
  blockGridStyle,
  slotImageStyle,
  slotWrapperStyle,
} from '@/shared/lib/appearance/applyAppearanceStyles';
import { loadGoogleFont } from '@/shared/lib/fonts/loadGoogleFont';
import { ArtPicture } from '@/shared/ui/ArtPicture';

import './GalleryBlockView.css';

export type GalleryBlockViewProps = {
  block: GalleryBlock;
  resolveArt: (artId: string) => ArtItemData | undefined;
  onSlotClick?: (pos: ItemPosition, e: React.MouseEvent) => void;
  renderEmptySlot?: (pos: ItemPosition) => ReactNode;
  renderArtContent?: (art: ArtItemData, pos: ItemPosition, picture: ReactNode) => ReactNode;
  children?: ReactNode;
  className?: string;
};

export function GalleryBlockView({
  block,
  resolveArt,
  onSlotClick,
  renderEmptySlot,
  renderArtContent,
  children,
  className,
}: GalleryBlockViewProps) {
  const { layout, items, caption, appearance } = block;
  const positions = LAYOUT_SCHEME[layout];

  // Load Google Fonts used by appearance captions
  useEffect(() => {
    if (!appearance) return;
    const fonts = new Set<string>();
    if (appearance.blockCaption) fonts.add(appearance.blockCaption.style.font);
    for (const pos of positions) {
      const slot = appearance.slots[pos];
      if (slot?.caption?.visible) fonts.add(slot.caption.style.font);
    }
    fonts.forEach(loadGoogleFont);
  }, [appearance, positions]);

  const gridStyle = blockGridStyle(appearance);
  const figureClass = [
    'block',
    layout,
    appearance ? 'block--custom' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  // ── block-level caption ──
  const captionStyle = appearance?.blockCaption
    ? {
        fontFamily: `'${appearance.blockCaption.style.font}', serif`,
        fontSize: `${appearance.blockCaption.style.size}px`,
        color: appearance.blockCaption.style.color,
      }
    : undefined;

  const captionAbove =
    appearance?.blockCaption?.position === 'above' && caption?.en ? (
      <figcaption style={captionStyle}>{caption.en}</figcaption>
    ) : null;

  const captionBelow =
    (!appearance?.blockCaption || appearance.blockCaption.position === 'below') && caption?.en ? (
      <figcaption style={captionStyle}>{caption.en}</figcaption>
    ) : null;

  // ── render slots ──
  const slots = positions.map((pos) => {
    const item = items.find((i) => i.position === pos);
    const slotApp = appearance?.slots[pos];

    // No item in this position
    if (!item) {
      if (!renderEmptySlot) return null;
      return (
        <div
          key={`empty-${pos}`}
          className="block__slot block__slot--empty"
          style={slotWrapperStyle(slotApp)}
          onClick={onSlotClick ? (e) => onSlotClick(pos, e) : undefined}
        >
          {renderEmptySlot(pos)}
        </div>
      );
    }

    // Art item — resolve from catalog
    const art = resolveArt(item.artId);
    if (!art) {
      // Art not found — render as empty-like placeholder
      if (!renderEmptySlot) return null;
      return (
        <div
          key={`missing-${pos}`}
          className="block__slot block__slot--empty"
          style={slotWrapperStyle(slotApp)}
          onClick={onSlotClick ? (e) => onSlotClick(pos, e) : undefined}
        >
          {renderEmptySlot(pos)}
        </div>
      );
    }

    // Build the default picture element
    const picture = (
      <ArtPicture
        role={onSlotClick ? 'button' : undefined}
        sources={art.images.preview}
        alt={art.images.alt?.en || art.title?.en || ''}
        onClick={onSlotClick ? (e) => onSlotClick(pos, e) : undefined}
        imgStyle={slotImageStyle(slotApp)}
      />
    );

    // Slot caption
    const slotCaption =
      slotApp?.caption?.visible && art.title?.en ? (
        <span
          className="block__slot-caption"
          style={{
            left: `${slotApp.caption.posX}%`,
            top: `${slotApp.caption.posY}%`,
            fontFamily: `'${slotApp.caption.style.font}', serif`,
            fontSize: `${slotApp.caption.style.size}px`,
            color: slotApp.caption.style.color,
          }}
        >
          {art.title.en}
        </span>
      ) : null;

    return (
      <div key={`${art.id}-${pos}`} className="block__slot" style={slotWrapperStyle(slotApp)}>
        {renderArtContent ? renderArtContent(art, pos, picture) : picture}
        {slotCaption}
      </div>
    );
  });

  return (
    <figure className={figureClass} style={gridStyle}>
      {captionAbove}
      {slots}
      {captionBelow}
      {children}
    </figure>
  );
}
