// entities/event/eventRenderContext.ts
// Extracts runtime context from stored event data.
// Encapsulates the business logic of "what counts as a paid enrollment."
// Source of truth: Docs/EVENT_PAGE_FINALIZATION.md §5

import type { EventPageData } from './eventPage.types';

export interface EventRenderContext {
  paidEnrollmentCount: number;
}

export function buildEventRenderContext(event: EventPageData): EventRenderContext {
  const enrollments = event.enrollments ?? {};
  return {
    paidEnrollmentCount: Object.values(enrollments).filter(
      (e) => e.paymentStatus === 'paid',
    ).length,
  };
}
