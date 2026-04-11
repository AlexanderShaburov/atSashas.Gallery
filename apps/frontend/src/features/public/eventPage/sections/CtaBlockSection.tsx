import type { CtaBlockData } from '../renderModel.types';

type Props = { data: CtaBlockData; onCtaClick?: () => void };

export function CtaBlockSection({ data, onCtaClick }: Props) {
  return (
    <section data-section="ctaBlock" className="ep-cta">
      <p className="ep-cta__bridge">{data.bridgeText}</p>
      <p className="ep-cta__meta">{data.metaLine}</p>
      {data.scarcityLabel && (
        <p className="ep-cta__scarcity">{data.scarcityLabel}</p>
      )}
      <button className="ep-cta__button" type="button" onClick={onCtaClick}>{data.ctaLabel}</button>
      {data.cancellationNote && (
        <p className="ep-cta__cancellation">{data.cancellationNote}</p>
      )}
    </section>
  );
}
