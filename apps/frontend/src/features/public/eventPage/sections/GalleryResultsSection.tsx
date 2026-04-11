import type { GalleryResultsData } from '../renderModel.types';

type Props = { data: GalleryResultsData };

export function GalleryResultsSection({ data }: Props) {
  return (
    <section data-section="galleryResults" className="ep-gallery ep-gallery--results">
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
