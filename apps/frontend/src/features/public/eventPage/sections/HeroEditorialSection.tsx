import type { HeroEditorialData } from '../renderModel.types';

type Props = { data: HeroEditorialData };

export function HeroEditorialSection({ data }: Props) {
  return (
    <section
      data-section="heroEditorial"
      className="ep-hero ep-hero--editorial"
      style={data.heroImage ? { backgroundImage: `url(${data.heroImage})` } : undefined}
    >
      <div className="ep-hero__content">
        <span className="ep-hero__eyebrow">{data.eyebrow}</span>
        <h1 className="ep-hero__title">{data.title}</h1>
        <span className="ep-hero__date">{data.dateDisplay}</span>
      </div>
    </section>
  );
}
