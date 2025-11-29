import { ImageBlock } from '@/entities/block';
import { getFromCatalog } from '@/features/gallery/api/catalogModule';

type ImageComponentProps = { block: ImageBlock };

export default function ImageComponent({ block }: ImageComponentProps) {
    const { layout, itemIds } = { ...block };

    return (
        <figure className={`block ${layout}`}>
            {itemIds.map((imgId) => {
                const img = getFromCatalog(imgId);
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
