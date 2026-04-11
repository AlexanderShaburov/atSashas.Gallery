import type { HeroStandardData } from '../renderModel.types';

type Props = { data: HeroStandardData };

export function HeroStandardSection({ data }: Props) {
  return (
    <section data-section="heroStandard" className="ep-hero ep-hero--standard">
      {data.heroImage && (
        <div className="ep-hero__image">
          <img src={data.heroImage} alt={data.title} />
        </div>
      )}
      <div className="ep-hero__content">
        <h1 className="ep-hero__title">{data.title}</h1>
        <p className="ep-hero__subtitle">{data.subtitle}</p>
        <div className="ep-hero__meta">
          <span className="ep-hero__date">{data.dateDisplay}</span>
          <span className="ep-hero__price">{data.priceDisplay}</span>
        </div>
      </div>
    </section>
  );
}
