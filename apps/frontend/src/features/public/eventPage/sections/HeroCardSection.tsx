import type { HeroCardData } from '../renderModel.types';

type Props = { data: HeroCardData; onCtaClick?: () => void };

export function HeroCardSection({ data, onCtaClick }: Props) {
  return (
    <section data-section="heroCard" className="ep-hero ep-hero--card">
      {data.heroImage && (
        <div className="ep-hero__image">
          <img src={data.heroImage} alt={data.title} />
        </div>
      )}
      <div className="ep-hero__content">
        {data.eyebrow && <span className="ep-hero__eyebrow">{data.eyebrow}</span>}
        <h1 className="ep-hero__title">{data.title}</h1>
        <p className="ep-hero__description">{data.description}</p>
        <dl className="ep-hero__facts">
          <div>
            <dt>Date</dt>
            <dd>{data.dateDisplay}</dd>
          </div>
          {data.time && (
            <div>
              <dt>Time</dt>
              <dd>{data.time}</dd>
            </div>
          )}
          <div>
            <dt>Location</dt>
            <dd>{data.location}</dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>{data.priceDisplay}</dd>
          </div>
        </dl>
        <button className="ep-cta__button" type="button" onClick={onCtaClick}>{data.ctaLabel}</button>
      </div>
    </section>
  );
}
