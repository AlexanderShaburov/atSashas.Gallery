import { GalleryBlock } from '@/entities/block';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';

type ImageComponentProps = { block: GalleryBlock };

export default function ImageComponent({ block }: ImageComponentProps) {
    const { layout, items } = { ...block };
    const catalog = useArtCatalog();

    console.log('[ImageComponent] Rendering block:', block.id, 'layout:', layout, 'items:', items.length);
    console.log('[ImageComponent] Catalog available:', !!catalog, 'Item count:', Object.keys(catalog?.items || {}).length);

    return (
        <figure className={`block ${layout}`}>
            {items.map((item) => {
                const img = catalog?.items?.[item.artId];
                console.log('[ImageComponent] Art item', item.artId, 'found:', !!img);
                if (!img) {
                    console.warn('[ImageComponent] Art item not found in catalog:', item.artId);
                    return null;
                }
                return (
                    <picture key={img.id} role="button" onClick={() => open(img.images.full)}>
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
