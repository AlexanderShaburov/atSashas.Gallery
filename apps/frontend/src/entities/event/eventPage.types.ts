// entities/event/eventPage.types.ts
// Event page data model — 4 preset-specific types + discriminated union.
// Source of truth: Docs/EVENT_PAGE_MODEL_SPEC.md, EVENT_PAGE_FINALIZATION.md

import type { Localized, Money } from '@/entities/common';

import type { Enrollment, EventStatus } from './event.types';

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** Reference to a MediaItemData by ID. */
export type MediaRef = string;

export const EVENT_PRESETS = ['workshop', 'pleinAir', 'exhibition', 'minimal'] as const;
export type EventPreset = (typeof EVENT_PRESETS)[number];

/** Gallery item with artwork metadata (Exhibition only). */
export interface CaptionedWork {
  image: MediaRef;
  title: Localized;
  medium?: Localized;
}

// ---------------------------------------------------------------------------
// Preset: Workshop
// ---------------------------------------------------------------------------

export interface WorkshopEventPage {
  // ── System ──
  id: string;
  slug: string;
  preset: 'workshop';
  status: EventStatus;
  enrollments?: Record<string, Enrollment>;
  /** ID of the associated EventData for enrollment. When absent, page.id is used. */
  eventId?: string;

  // ── Hero ──
  title: Localized;
  subtitle: Localized;
  heroImage?: MediaRef;

  // ── QuickFacts ──
  dateStart?: string;
  duration?: Localized;
  location: Localized;
  mapUrl?: string;
  price?: Money;
  capacity?: number;

  // ── Description ──
  description: Localized;

  // ── HostNote ──
  hostNote?: Localized;
  hostName?: string;
  hostNoteLabel?: Localized;

  // ── GalleryExperience ──
  experienceImages?: MediaRef[];
  experienceTitle?: Localized;

  // ── GalleryResults ──
  resultsImages?: MediaRef[];
  resultsTitle?: Localized;

  // ── CtaBlock ──
  ctaLabel: Localized;
  ctaBridge: Localized;
  cancellationNote?: Localized;
}

// ---------------------------------------------------------------------------
// Preset: Plein Air
// ---------------------------------------------------------------------------

export interface PleinAirEventPage {
  // ── System ──
  id: string;
  slug: string;
  preset: 'pleinAir';
  status: EventStatus;
  enrollments?: Record<string, Enrollment>;
  /** ID of the associated EventData for enrollment. When absent, page.id is used. */
  eventId?: string;

  // ── Hero (cinematic) ──
  title: Localized;
  subtitle: Localized;
  eyebrow?: Localized;
  heroImage?: MediaRef;

  // ── Bridge ──
  bridgeLine?: Localized;

  // ── Description ──
  description: Localized;

  // ── GalleryExperience ──
  experienceImages?: MediaRef[];
  experienceTitle?: Localized;

  // ── HostNote ──
  hostNote?: Localized;
  hostName?: string;
  hostNoteLabel?: Localized;

  // ── GalleryResults ──
  resultsImages?: MediaRef[];
  resultsTitle?: Localized;

  // ── QuickFacts ──
  dateStart?: string;
  dateEnd?: string;
  sessions?: Localized;
  meetingPoint?: Localized;
  location: Localized;
  mapUrl?: string;
  groupSize?: number;
  price?: Money;

  // ── CtaBlock ──
  ctaLabel: Localized;
  ctaBridge: Localized;
  cancellationNote?: Localized;
}

// ---------------------------------------------------------------------------
// Preset: Exhibition
// ---------------------------------------------------------------------------

export interface ExhibitionEventPage {
  // ── System ──
  id: string;
  slug: string;
  preset: 'exhibition';
  status: EventStatus;
  enrollments?: Record<string, Enrollment>;
  /** ID of the associated EventData for enrollment. When absent, page.id is used. */
  eventId?: string;

  // ── Hero (editorial) ──
  title: Localized;
  eyebrow?: Localized;
  heroImage?: MediaRef;

  // ── Description (curatorial) ──
  description: Localized;
  descriptionLabel?: Localized;

  // ── Featured Works ──
  featuredWorks?: CaptionedWork[];
  featuredWorksTitle?: Localized;

  // ── HostNote ──
  hostNote?: Localized;
  hostNoteLabel?: Localized;
  hostName?: string;

  // ── VisitDetails ──
  dateStart?: string;
  dateEnd?: string;
  openingDate?: string;
  openingTime?: string;
  hours?: Localized;
  location: Localized;
  admission?: Localized;

  // ── CtaBlock (soft) ──
  ctaLabel: Localized;
  secondaryAction?: Localized;
}

// ---------------------------------------------------------------------------
// Preset: Minimal
// ---------------------------------------------------------------------------

export interface MinimalEventPage {
  // ── System ──
  id: string;
  slug: string;
  preset: 'minimal';
  status: EventStatus;
  enrollments?: Record<string, Enrollment>;
  /** ID of the associated EventData for enrollment. When absent, page.id is used. */
  eventId?: string;

  // ── HeroCard (integrated) ──
  title: Localized;
  eyebrow?: Localized;
  heroImage?: MediaRef;
  description: Localized;

  // ── Facts (inline in card) ──
  dateStart?: string;
  dateEnd?: string;
  time?: string;
  location: Localized;
  mapUrl?: string;
  price?: Money;

  // ── CTA (inline in card) ──
  ctaLabel: Localized;

  // ── Extended Description (below fold) ──
  extendedDescription?: Localized;
}

// ---------------------------------------------------------------------------
// Union
// ---------------------------------------------------------------------------

export type EventPageData =
  | WorkshopEventPage
  | PleinAirEventPage
  | ExhibitionEventPage
  | MinimalEventPage;

// ---------------------------------------------------------------------------
// Resolved types (after render-time default resolution)
// Category B fields are guaranteed non-undefined.
// ---------------------------------------------------------------------------

type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type ResolvedWorkshopEventPage = WithRequired<
  WorkshopEventPage,
  'experienceTitle' | 'resultsTitle' | 'hostNoteLabel'
>;

export type ResolvedPleinAirEventPage = WithRequired<
  PleinAirEventPage,
  'eyebrow' | 'experienceTitle' | 'resultsTitle' | 'hostNoteLabel'
>;

export type ResolvedExhibitionEventPage = WithRequired<
  ExhibitionEventPage,
  'eyebrow' | 'descriptionLabel' | 'featuredWorksTitle' | 'hostNoteLabel' | 'secondaryAction'
>;

export type ResolvedMinimalEventPage = MinimalEventPage;

export type ResolvedEventPageData =
  | ResolvedWorkshopEventPage
  | ResolvedPleinAirEventPage
  | ResolvedExhibitionEventPage
  | ResolvedMinimalEventPage;
