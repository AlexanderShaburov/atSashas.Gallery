// entities/event/eventDefaults.ts
// Two categories of defaults. A field MUST NOT appear in both maps.
//
// Category A (CREATION_DEFAULTS) — materialized into storage on event creation.
// Category B (RENDER_DEFAULTS)   — resolved at render time if absent from storage.
//
// Source of truth: Docs/EVENT_PAGE_FINALIZATION.md §3.3

import type { Localized } from '@/entities/common';

import type { EventPreset } from './eventPage.types';

// ---------------------------------------------------------------------------
// Category A — Creation defaults
// ---------------------------------------------------------------------------

export interface CreationDefaults {
  ctaLabel: Localized;
  ctaBridge?: Localized;
}

export const CREATION_DEFAULTS: Record<EventPreset, CreationDefaults> = {
  workshop: {
    ctaLabel: { en: 'Reserve Your Spot' },
    ctaBridge: {
      en: "You'll leave with your own finished piece — and the confidence to keep painting.",
    },
  },
  pleinAir: {
    ctaLabel: { en: 'Join This Session' },
    ctaBridge: {
      en: 'Two mornings on the coast, and a sketchbook of paintings you made there.',
    },
  },
  exhibition: {
    ctaLabel: { en: 'RSVP for Opening' },
  },
  minimal: {
    ctaLabel: { en: 'RSVP' },
  },
};

// ---------------------------------------------------------------------------
// Category B — Render defaults
// ---------------------------------------------------------------------------

export type RenderDefaults = Partial<Record<string, Localized>>;

export const RENDER_DEFAULTS: Record<EventPreset, RenderDefaults> = {
  workshop: {
    experienceTitle: { en: 'The Workshop Experience' },
    resultsTitle: { en: 'Participant Results' },
    hostNoteLabel: { en: 'A note from the host' },
  },
  pleinAir: {
    eyebrow: { en: 'Plein Air Session' },
    experienceTitle: { en: 'The Setting' },
    resultsTitle: { en: 'What Participants Created' },
    hostNoteLabel: { en: 'A note from the host' },
  },
  exhibition: {
    eyebrow: { en: 'Exhibition' },
    descriptionLabel: { en: 'About the Exhibition' },
    featuredWorksTitle: { en: 'Selected Works' },
    hostNoteLabel: { en: 'From the artist' },
    secondaryAction: { en: 'Add to calendar' },
  },
  minimal: {
    // No Category B fields for Minimal
  },
};
