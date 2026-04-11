import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import type { EventPageData } from '@/entities/event';
import type { MediaItemData } from '@/entities/mediaItem';
import type { ArtItemData } from '@/entities/art';
import { resolveEventDefaults } from '@/entities/event/resolveEventDefaults';
import { buildEventRenderContext } from '@/entities/event/eventRenderContext';
import { mapEventToRenderModel } from '@/features/public/eventPage/mapEventToRenderModel';
import { EventPageView } from '@/features/public/eventPage/EventPageView';
import { EnrollmentForm } from '@/features/public/ui/EventCta/EnrollmentForm';
import { loadMediaItemsOnce, getMediaItem } from '@/features/public/api/mediaItemsModule';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function mediaRefToUrl(item: MediaItemData): string | null {
  if (item.media.kind === 'image') {
    return item.media.sources.preview.jpeg ?? item.media.sources.full ?? null;
  }
  if (item.media.kind === 'video') {
    return item.media.sources.posterUrl ?? null;
  }
  return null;
}

function artRefToUrl(item: ArtItemData): string | null {
  return item.images?.preview?.jpeg ?? item.images?.full ?? null;
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const artCatalog = useArtCatalog();
  const [page, setPage] = useState<EventPageData | null>(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEnrollment, setShowEnrollment] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('No event page ID provided');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [res] = await Promise.all([
          fetch(`${API_BASE}/public/event-pages/${id}`),
          loadMediaItemsOnce(),
        ]);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Event page not found');
          } else {
            setError(`Failed to load event page: ${res.statusText}`);
          }
          return;
        }
        const data: EventPageData = await res.json();
        if (!cancelled) {
          setPage(data);
          setMediaReady(true);
        }
      } catch (e) {
        if (!cancelled) setError(`Failed to load event page: ${e}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  const resolveVisualUrl = useCallback((ref: string): string | null => {
    // Try media items first
    const mediaItem = getMediaItem(ref);
    if (mediaItem) return mediaRefToUrl(mediaItem);
    // Try art catalog
    const artItem = artCatalog?.items[ref];
    if (artItem) return artRefToUrl(artItem);
    return null;
  }, [artCatalog]);

  const handleCtaClick = useCallback(() => {
    setShowEnrollment(true);
  }, []);

  if (loading) return <div className="infoContainer">Loading...</div>;
  if (error) return <div className="infoContainer">{error}</div>;
  if (!page) return <div className="infoContainer">Event page not found.</div>;

  const record = page as unknown as Record<string, unknown>;
  const price = record['price'] as { amount?: number } | undefined;
  const isFree = !price || !price.amount || price.amount <= 0;
  const canEnroll = page.status === 'scheduled';

  const resolved = resolveEventDefaults(page);
  const context = buildEventRenderContext(page);
  const model = mapEventToRenderModel(resolved, context, {
    resolveMediaUrl: mediaReady ? resolveVisualUrl : undefined,
  });

  return (
    <>
      <EventPageView model={model} onCtaClick={canEnroll ? handleCtaClick : undefined} />
      {showEnrollment && canEnroll && (
        <EnrollmentForm
          eventId={page.eventId ?? page.id}
          isFree={isFree}
          onCancel={() => setShowEnrollment(false)}
        />
      )}
    </>
  );
}
