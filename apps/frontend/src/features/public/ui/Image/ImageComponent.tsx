import { GalleryBlock } from '@/entities/block';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';

type ImageComponentProps = { block: GalleryBlock };

export default function ImageComponent({ block }: ImageComponentProps) {
    const { layout, items, caption } = block;
    const catalog = useArtCatalog();

    return (
        <figure className={`block ${layout}`}>
            {items.map((item) => {
                const img = catalog?.items?.[item.artId];
                if (!img) return null;
                return (
                    <picture key={img.id} role="button" onClick={() => open(img.images.full)}>
                        <source type="image/avif" srcSet={img.images.preview.avif} />
                        <source type="image/webp" srcSet={img.images.preview.webp} />
                        <img
                            src={img.images.preview.jpeg}
                            alt={img.images.alt?.en || img.title?.en || ''}
                            loading="lazy"
                        />
                    </picture>
                );
            })}
            {caption?.en && <figcaption>{caption.en}</figcaption>}
        </figure>
    );
}
