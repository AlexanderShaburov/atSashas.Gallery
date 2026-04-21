import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import type { EventPageData } from '@/entities/event';
import { resolveCtaAction } from '@/entities/event';
import type { MediaItemData } from '@/entities/mediaItem';
import type { ArtItemData } from '@/entities/art';
import { resolveEventDefaults } from '@/entities/event/resolveEventDefaults';
import { buildEventRenderContext } from '@/entities/event/eventRenderContext';
import { mapEventToRenderModel } from '@/features/public/eventPage/mapEventToRenderModel';
import { EventPageView } from '@/features/public/eventPage/EventPageView';
import { EnrollmentForm } from '@/features/public/ui/EventCta/EnrollmentForm';
import { loadMediaItemsOnce, getMediaItem } from '@/features/public/api/mediaItemsModule';
import { useArtCatalog } from '@/shared/ArtCatalogProvider/CatalogHook';
import { trackCtaClick } from '@/shared/analytics/track';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

type Mode = 'public' | 'preview';

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

export default function EventPage({ mode = 'public' }: { mode?: Mode }) {
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
        // Preview mode hits the admin event-pages endpoint so draft pages
        // are visible (matching the Homepage Editor's resolver). Public mode
        // uses the status-filtered public endpoint — drafts 404 by design.
        const eventUrl =
          mode === 'preview'
            ? `${API_BASE}/admin/event-pages/${id}`
            : `${API_BASE}/public/event-pages/${id}`;
        const [res] = await Promise.all([
          fetch(eventUrl),
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
  }, [id, mode]);

  const resolveVisualUrl = useCallback((ref: string): string | null => {
    // Try media items first
    const mediaItem = getMediaItem(ref);
    if (mediaItem) return mediaRefToUrl(mediaItem);
    // Try art catalog
    const artItem = artCatalog?.items[ref];
    if (artItem) return artRefToUrl(artItem);
    return null;
  }, [artCatalog]);

  // CTA dispatch.
  // `register` requires status === 'scheduled' only. Per the EventPage
  // canonicalization ADR, the EventPage *is* the event — enrollments persist
  // on the page record (`EventPageData.enrollments`) and the endpoint is
  // addressed by `page.id`. The legacy `eventId` field is retained in the
  // schema for data compatibility but no longer participates in dispatch.
  // `external` and `inquiry` are available on any status the page was served
  // under (public = scheduled only; preview = any).
  const ctaAction = page ? resolveCtaAction(page) : null;
  const canEnroll =
    !!page && page.status === 'scheduled' && ctaAction?.kind === 'register';

  const handleCtaClick = useCallback(() => {
    if (!page || !ctaAction) return;
    trackCtaClick({
      eventId: page.id,
      eventPageId: page.id,
      ctaKind: ctaAction.kind,
      mode,
    });
    switch (ctaAction.kind) {
      case 'external':
        if (ctaAction.url) window.open(ctaAction.url, '_blank', 'noopener,noreferrer');
        return;
      case 'register':
        if (!canEnroll) return;
        setShowEnrollment(true);
        return;
      case 'inquiry':
        alert('Coming soon');
        return;
    }
  }, [page, ctaAction, canEnroll, mode]);

  if (loading) return <div className="infoContainer">Loading...</div>;
  if (error) return <div className="infoContainer">{error}</div>;
  if (!page || !ctaAction) return <div className="infoContainer">Event page not found.</div>;

  const record = page as unknown as Record<string, unknown>;
  const price = record['price'] as { amount?: number } | undefined;
  // `isFree` derives from the EventPage's `price`. Matches the backend's
  // `has_price = page.price is not None and page.price.amount > 0` check.
  const isFree = !price || !price.amount || price.amount <= 0;

  const resolved = resolveEventDefaults(page);
  const context = buildEventRenderContext(page);
  const model = mapEventToRenderModel(resolved, context, {
    resolveMediaUrl: mediaReady ? resolveVisualUrl : undefined,
  });

  // Any CTA kind gets a clickable button; register is additionally gated by
  // canEnroll. External/inquiry are always clickable regardless of status.
  const ctaEnabled =
    ctaAction.kind === 'register'
      ? canEnroll
      : ctaAction.kind === 'external'
        ? !!ctaAction.url
        : true;

  return (
    <>
      <EventPageView model={model} onCtaClick={ctaEnabled ? handleCtaClick : undefined} />
      {showEnrollment && canEnroll && (
        <EnrollmentForm
          eventId={page.id}
          isFree={isFree}
          onCancel={() => setShowEnrollment(false)}
        />
      )}
    </>
  );
}
