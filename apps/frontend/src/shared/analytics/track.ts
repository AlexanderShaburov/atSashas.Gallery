// shared/analytics/track.ts
// Phase 1 analytics emission — console-only. The vocabulary here is the same
// as the one defined in plan--events--cta-registration-system.md §2.4 so a
// Phase 5 backend ingest can be added without changing call sites.
//
// Preview mode emissions are suppressed by default so draft interactions do
// not pollute the public funnel.

import type { CtaActionKind } from '@/entities/event';

export type AnalyticsMode = 'public' | 'preview';

export type CtaClickPayload = {
  eventId?: string;
  eventPageId?: string;
  ctaKind: CtaActionKind;
  mode?: AnalyticsMode;
};

export function trackCtaClick(payload: CtaClickPayload): void {
  if (payload.mode === 'preview') return;
  console.info('[analytics] cta_click', payload);
}
