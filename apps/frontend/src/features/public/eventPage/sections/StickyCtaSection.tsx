import type { StickyCtaData } from '../renderModel.types';

type Props = { data: StickyCtaData; onCtaClick?: () => void };

export function StickyCtaSection({ data, onCtaClick }: Props) {
  return (
    <div data-section="stickyCta" className="ep-sticky-cta" role="complementary">
      <div className="ep-sticky-cta__info">
        <span className="ep-sticky-cta__price">{data.priceDisplay}</span>
        <span className="ep-sticky-cta__date">{data.dateDisplay}</span>
        {data.groupSizeDisplay && (
          <span className="ep-sticky-cta__group">{data.groupSizeDisplay}</span>
        )}
        {data.scarcityLabel && (
          <span className="ep-sticky-cta__scarcity">{data.scarcityLabel}</span>
        )}
      </div>
      <button className="ep-cta__button" type="button" onClick={onCtaClick}>{data.ctaLabel}</button>
    </div>
  );
}
