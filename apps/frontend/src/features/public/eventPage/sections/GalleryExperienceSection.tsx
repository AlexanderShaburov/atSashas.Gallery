import type { GalleryExperienceData } from '../renderModel.types';

type Props = { data: GalleryExperienceData };

export function GalleryExperienceSection({ data }: Props) {
  return (
    <section data-section="galleryExperience" className="ep-gallery ep-gallery--experience">
      <h2 className="ep-gallery__title">{data.title}</h2>
      <div className="ep-gallery__grid" data-layout={data.layout ?? 'default'}>
        {data.images.map((img, i) => (
          <figure key={img} className="ep-gallery__item">
            <img src={img} alt={`${data.title} ${i + 1}`} />
          </figure>
        ))}
      </div>
    </section>
  );
}
