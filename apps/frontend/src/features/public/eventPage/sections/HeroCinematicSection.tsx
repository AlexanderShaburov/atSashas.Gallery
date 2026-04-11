import type { HeroCinematicData } from '../renderModel.types';

type Props = { data: HeroCinematicData };

export function HeroCinematicSection({ data }: Props) {
  return (
    <section
      data-section="heroCinematic"
      className="ep-hero ep-hero--cinematic"
      style={data.heroImage ? { backgroundImage: `url(${data.heroImage})` } : undefined}
    >
      <div className="ep-hero__content">
        <span className="ep-hero__eyebrow">{data.eyebrow}</span>
        <h1 className="ep-hero__title">{data.title}</h1>
        <p className="ep-hero__subtitle">{data.subtitle}</p>
      </div>
    </section>
  );
}
