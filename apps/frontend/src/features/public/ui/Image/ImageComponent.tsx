import { GalleryBlock } from '@/entities/block';
import { getFromCatalog } from '@/features/public/api/catalogModule';

type ImageComponentProps = { block: GalleryBlock };

export default function ImageComponent({ block }: ImageComponentProps) {
    const { layout, items } = { ...block };

    return (
        <figure className={`block ${layout}`}>
            {items.map((item) => {
                const img = getFromCatalog(item.artId);
                if (!img) return null;
                return (
                    <picture
                        key={img.id ?? imgId}
                        role="button"
                        onClick={() => open(img.images.full)}
                    >
                        <source type="image/avif" srcSet={img.images.preview.avif} />
                        <source type="image/webp" srcSet={img.images.preview.webp} />
                        <img
                            src={img.images.preview.jpeg}
                            alt={img.images.alt.en || ''}
                            loading="lazy"
                        />
                    </picture>
                );
            })}
        </figure>
    );
}
