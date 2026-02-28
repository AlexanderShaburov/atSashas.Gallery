import { GalleryBlock, GalleryBlockItem, GalleryLayout, ItemPosition } from '@/entities/block';
import { isEventItem } from '@/shared/lib/checkers/blockItemGuards';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
import { GallerySlotEventView } from './GallerySlotEventView';

/**
 * CSS :nth-child() render order for each layout.
 * Must match the grid-column/grid-row assignments in Gallery.css.
 */
const RENDER_ORDER: Record<GalleryLayout, ItemPosition[]> = {
    single: ['Center'],
    pairHorizontal: ['Left', 'Right'],
    pairVertical: ['Up', 'Bottom'],
    triptychHorizontal: ['Left', 'Center', 'Right'],
    triptychLeft: ['LUC', 'LBC', 'Right'],
    triptychRight: ['Left', 'RUC', 'RBC'],
};

function sortByLayout(items: GalleryBlockItem[], layout: GalleryLayout): GalleryBlockItem[] {
    const order = RENDER_ORDER[layout];
    return [...items].sort((a, b) => {
        const ai = order.indexOf(a.position);
        const bi = order.indexOf(b.position);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
}

type ImageComponentProps = { block: GalleryBlock };

export default function ImageComponent({ block }: ImageComponentProps) {
    const { layout, items, caption } = block;
    const catalog = useArtCatalog();
    const sorted = sortByLayout(items, layout);

    return (
        <figure className={`block ${layout}`}>
            {sorted.map((item) => {
                if (isEventItem(item)) {
                    return (
                        <GallerySlotEventView
                            key={`event-${item.position}`}
                            item={item}
                        />
                    );
                }

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
