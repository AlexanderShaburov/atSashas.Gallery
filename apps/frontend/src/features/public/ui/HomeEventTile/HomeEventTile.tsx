// features/public/ui/HomeEventTile/HomeEventTile.tsx
//
// Public home tile for an EventPage reference.
// Reads EventPageData exclusively — no EventData, no useEvent(), no legacy
// /api/public/events. Hero image is resolved via the public media-items cache
// (loadMediaItemsOnce primed by useHomeFeed) with an ArtItem fallback from
// the ArtCatalog context.

import type { EventPageData } from '@/entities/event';
import type { MediaItemData } from '@/entities/mediaItem';
import type { ArtItemData } from '@/entities/art';
import { getMediaItem } from '@/features/public/api/mediaItemsModule';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
import { Link } from 'react-router-dom';
import './HomeEventTile.css';

type Props = {
    page: EventPageData;
    /** 'public' → /event/:id ; 'preview' → /preview/event/:id (admin-backed). */
    mode?: 'public' | 'preview';
};

function formatDate(iso: string | undefined): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
}

function mediaRefToUrl(item: MediaItemData): string | undefined {
    if (item.media.kind === 'image') {
        return item.media.sources.preview?.jpeg ?? item.media.sources.full;
    }
    if (item.media.kind === 'video') {
        return item.media.sources.posterUrl ?? undefined;
    }
    return undefined;
}

function artRefToUrl(item: ArtItemData): string | undefined {
    return item.images?.preview?.jpeg ?? item.images?.full;
}

export function HomeEventTile({ page, mode = 'public' }: Props) {
    const artCatalog = useArtCatalog();
    const title = page.title?.en ?? page.id;
    const dateStart = 'dateStart' in page ? (page as { dateStart?: string }).dateStart : undefined;
    const formattedDate = formatDate(dateStart);

    // Resolve heroImage: try media items first, then art catalog.
    let heroUrl: string | undefined;
    if (page.heroImage) {
        const mediaItem = getMediaItem(page.heroImage);
        if (mediaItem) {
            heroUrl = mediaRefToUrl(mediaItem);
        } else {
            const artItem = artCatalog?.items?.[page.heroImage];
            if (artItem) heroUrl = artRefToUrl(artItem);
        }
    }

    const linkTo = mode === 'preview' ? `/preview/event/${page.id}` : `/event/${page.id}`;

    return (
        <nav className="home-nav">
            <Link
                to={linkTo}
                className={`tile home-event-tile${heroUrl ? ' home-event-tile--has-hero' : ''}`}
                aria-label={title}
            >
                {heroUrl && (
                    <img
                        src={heroUrl}
                        alt=""
                        loading="lazy"
                        className="home-event-tile__hero"
                    />
                )}
                <div className="home-event-tile__body">
                    <span className={`home-event-tile__preset home-event-tile__preset--${page.preset}`}>
                        {page.preset}
                    </span>
                    <h3 className="home-event-tile__title">{title}</h3>
                    {formattedDate && (
                        <p className="home-event-tile__date">{formattedDate}</p>
                    )}
                </div>
            </Link>
        </nav>
    );
}
