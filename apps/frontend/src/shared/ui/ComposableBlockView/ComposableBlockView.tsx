import type { ReactNode } from 'react';
import { useEffect } from 'react';

import type { ComposableBlock, ItemPosition } from '@/entities/block';
import { LAYOUT_SCHEME } from '@/entities/block';
import type { RenderableResolver } from '@/entities/renderable';
import {
  blockGridStyle,
  slotImageStyle,
  slotWrapperStyle,
} from '@/shared/lib/appearance/applyAppearanceStyles';
import { loadGoogleFont } from '@/shared/lib/fonts/loadGoogleFont';
import { RenderableView } from '@/shared/ui/RenderableView';

import '../GalleryBlockView/GalleryBlockView.css';

export type ComposableBlockViewProps = {
  block: ComposableBlock;
  resolver: RenderableResolver;
  onSlotClick?: (pos: ItemPosition, e: React.MouseEvent) => void;
  renderEmptySlot?: (pos: ItemPosition) => ReactNode;
  renderSlotOverlay?: (pos: ItemPosition) => ReactNode;
  children?: ReactNode;
  className?: string;
};

export function ComposableBlockView({
  block,
  resolver,
  onSlotClick,
  renderEmptySlot,
  renderSlotOverlay,
  children,
  className,
}: ComposableBlockViewProps) {
  const { layout, slots, caption, appearance } = block;
  const positions = LAYOUT_SCHEME[layout];

  // Load Google Fonts used by appearance captions
  useEffect(() => {
    if (!appearance) return;
    const fonts = new Set<string>();
    if (appearance.blockCaption) fonts.add(appearance.blockCaption.style.font);
    for (const pos of positions) {
      const slotApp = appearance.slots[pos];
      if (slotApp?.caption?.visible) fonts.add(slotApp.caption.style.font);
    }
    fonts.forEach(loadGoogleFont);
  }, [appearance, positions]);

  const gridStyle = blockGridStyle(appearance);
  const figureClass = ['block', layout, appearance ? 'block--custom' : '', className ?? '']
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
  const slotElements = positions.map((pos) => {
    const slot = slots.find((s) => s.position === pos);
    const slotApp = appearance?.slots[pos];

    // No slot content for this position
    if (!slot) {
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

    // Slot caption
    const slotCaption =
      slotApp?.caption?.visible && slot.caption?.en ? (
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
          {slot.caption.en}
        </span>
      ) : null;

    return (
      <div
        key={`slot-${pos}`}
        className="block__slot"
        style={slotWrapperStyle(slotApp)}
        onClick={onSlotClick ? (e) => onSlotClick(pos, e) : undefined}
      >
        <RenderableView
          renderable={slot.content}
          resolver={resolver}
          imgStyle={slotImageStyle(slotApp)}
        />
        {slotCaption}
        {renderSlotOverlay?.(pos)}
      </div>
    );
  });

  return (
    <figure className={figureClass} style={gridStyle}>
      {captionAbove}
      {slotElements}
      {captionBelow}
      {children}
    </figure>
  );
}
