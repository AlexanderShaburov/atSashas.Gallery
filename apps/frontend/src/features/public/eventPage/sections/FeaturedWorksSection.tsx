import type { FeaturedWorksData } from '../renderModel.types';

type Props = { data: FeaturedWorksData };

export function FeaturedWorksSection({ data }: Props) {
  return (
    <section data-section="featuredWorks" className="ep-featured-works">
      <h2 className="ep-featured-works__title">{data.title}</h2>
      <div className="ep-featured-works__grid" data-layout={data.layout ?? 'default'}>
        {data.works.map((work) => (
          <figure key={work.image} className="ep-featured-works__item">
            <img src={work.image} alt={work.title} />
            <figcaption>
              <span className="ep-featured-works__work-title">{work.title}</span>
              {work.medium && (
                <span className="ep-featured-works__medium">{work.medium}</span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
