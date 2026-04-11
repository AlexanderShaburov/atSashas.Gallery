// entities/event/resolveEventDefaults.ts
// Resolves Category B defaults at render time.
// Does NOT mutate input. Does NOT compute derived fields.
// Source of truth: Docs/EVENT_PAGE_FINALIZATION.md §3.2

import type { Localized } from '@/entities/common';

import { RENDER_DEFAULTS } from './eventDefaults';
import type { EventPageData, ResolvedEventPageData } from './eventPage.types';

export function resolveEventDefaults(event: EventPageData): ResolvedEventPageData {
  const defaults = RENDER_DEFAULTS[event.preset];
  const resolved: Record<string, Localized> = {};

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const storedValue = (event as unknown as Record<string, unknown>)[key] as
      | Localized
      | undefined;
    resolved[key] = storedValue ?? defaultValue!;
  }

  return { ...event, ...resolved } as ResolvedEventPageData;
}
