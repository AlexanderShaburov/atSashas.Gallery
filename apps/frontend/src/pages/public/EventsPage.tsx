import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { EventPageData } from '@/entities/event';
import type { EventPageCatalog } from '@/shared/state';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
import { loadMediaItemsOnce, getMediaItem } from '@/features/public/api/mediaItemsModule';
import './EventsPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function useVisualUrl(ref: string | undefined, artCatalog: { items: Record<string, { images?: { preview?: { jpeg?: string }; full?: string } }> } | undefined): string | undefined {
  if (!ref) return undefined;
  const mi = getMediaItem(ref);
  if (mi?.media.kind === 'image') return mi.media.sources.preview.jpeg ?? mi.media.sources.full;
  const ai = artCatalog?.items[ref];
  if (ai?.images) return ai.images.preview?.jpeg ?? ai.images.full;
  return undefined;
}

function localizedEn(loc: { en?: string } | undefined): string {
  return loc?.en ?? '';
}

function EventCard({ page, artCatalog }: { page: EventPageData; artCatalog: ReturnType<typeof useArtCatalog> }) {
  const heroUrl = useVisualUrl((page as unknown as Record<string, unknown>).heroImage as string | undefined, artCatalog);
  const title = localizedEn(page.title) || 'Untitled';
  const description = localizedEn(page.description);
  const ctaLabel = localizedEn(page.ctaLabel);

  return (
    <Link to={`/event/${page.id}`} className="events-page__card">
      {heroUrl ? (
        <div className="events-page__card-hero">
          <img src={heroUrl} alt={title} loading="lazy" />
        </div>
      ) : (
        <div className="events-page__card-hero events-page__card-hero--empty" />
      )}
      <div className="events-page__card-body">
        <span className="events-page__card-preset">{page.preset}</span>
        <h2 className="events-page__card-title">{title}</h2>
        {description && <p className="events-page__card-desc">{description}</p>}
        {ctaLabel && <span className="events-page__card-cta">{ctaLabel}</span>}
      </div>
    </Link>
  );
}

export default function EventsPage() {
  const artCatalog = useArtCatalog();
  const [pages, setPages] = useState<EventPageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [res] = await Promise.all([
          fetch(`${API_BASE}/public/event-pages`),
          loadMediaItemsOnce(),
        ]);
        if (!res.ok) {
          setError(`Failed to load events: ${res.statusText}`);
          return;
        }
        const catalog: EventPageCatalog = await res.json();
        if (!cancelled) {
          setPages(Object.values(catalog.pages));
        }
      } catch (e) {
        if (!cancelled) setError(`Failed to load events: ${e}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="infoContainer">Loading events...</div>;
  if (error) return <div className="infoContainer">{error}</div>;

  if (pages.length === 0) {
    return (
      <section className="events-page">
        <h1 className="events-page__title">Events</h1>
        <div className="infoContainer">No upcoming events at the moment.</div>
      </section>
    );
  }

  return (
    <section className="events-page">
      <h1 className="events-page__title">Events</h1>
      <div className="events-page__grid">
        {pages.map((page) => (
          <EventCard key={page.id} page={page} artCatalog={artCatalog} />
        ))}
      </div>
    </section>
  );
}
