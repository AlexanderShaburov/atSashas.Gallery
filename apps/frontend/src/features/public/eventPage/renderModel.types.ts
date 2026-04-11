// features/public/eventPage/renderModel.types.ts
// Per-section render payload types for event pages.
// Stage 5A: pure presentation model — no business logic, no undefined, no optionals.

import type { ExhibitionLayout, ExperienceLayout, ResultsLayout } from '@/entities/event/eventDerived';
import type { EventPreset, MediaRef } from '@/entities/event/eventPage.types';

// ---------------------------------------------------------------------------
// Shared render primitives
// ---------------------------------------------------------------------------

export interface RenderCaptionedWork {
  image: MediaRef;
  title: string;
  medium: string;
}

export interface QuickFactRenderItem {
  label: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Hero variants
// ---------------------------------------------------------------------------

export interface HeroStandardData {
  title: string;
  subtitle: string;
  heroImage: MediaRef | null;
  priceDisplay: string;
  dateDisplay: string;
}

export interface HeroCinematicData {
  title: string;
  subtitle: string;
  heroImage: MediaRef | null;
  eyebrow: string;
}

export interface HeroEditorialData {
  title: string;
  heroImage: MediaRef | null;
  eyebrow: string;
  dateDisplay: string;
}

export interface HeroCardData {
  title: string;
  description: string;
  dateDisplay: string;
  location: string;
  ctaLabel: string;
  heroImage: MediaRef | null;
  time: string;
  priceDisplay: string;
  eyebrow: string;
}

// ---------------------------------------------------------------------------
// Content sections
// ---------------------------------------------------------------------------

export interface BridgeData {
  text: string;
}

export interface QuickFactsData {
  items: QuickFactRenderItem[];
}

export interface DescriptionData {
  label: string;
  text: string;
  thesisLine: string;
  bodyParagraphs: string;
}

export interface HostNoteData {
  label: string;
  note: string;
  hostName: string;
}

export interface GalleryExperienceData {
  title: string;
  images: MediaRef[];
  layout: ExperienceLayout | null;
}

export interface GalleryResultsData {
  title: string;
  images: MediaRef[];
  layout: ResultsLayout | null;
}

export interface FeaturedWorksData {
  title: string;
  works: RenderCaptionedWork[];
  layout: ExhibitionLayout | null;
}

// ---------------------------------------------------------------------------
// CTA variants
// ---------------------------------------------------------------------------

export interface CtaBlockData {
  bridgeText: string;
  ctaLabel: string;
  metaLine: string;
  scarcityLabel: string | null;
  cancellationNote: string;
}

export interface VisitCtaData {
  dateDisplay: string;
  hours: string;
  location: string;
  admission: string;
  ctaLabel: string;
  openingDisplay: string;
  secondaryAction: string;
}

export interface StickyCtaData {
  priceDisplay: string;
  dateDisplay: string;
  groupSizeDisplay: string;
  ctaLabel: string;
  scarcityLabel: string | null;
}

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export type RenderEventSection =
  | { kind: 'heroStandard'; data: HeroStandardData }
  | { kind: 'heroCinematic'; data: HeroCinematicData }
  | { kind: 'heroEditorial'; data: HeroEditorialData }
  | { kind: 'heroCard'; data: HeroCardData }
  | { kind: 'bridge'; data: BridgeData }
  | { kind: 'quickFacts'; data: QuickFactsData }
  | { kind: 'description'; data: DescriptionData }
  | { kind: 'hostNote'; data: HostNoteData }
  | { kind: 'galleryExperience'; data: GalleryExperienceData }
  | { kind: 'galleryResults'; data: GalleryResultsData }
  | { kind: 'featuredWorks'; data: FeaturedWorksData }
  | { kind: 'ctaBlock'; data: CtaBlockData }
  | { kind: 'visitCta'; data: VisitCtaData }
  | { kind: 'stickyCta'; data: StickyCtaData };

// ---------------------------------------------------------------------------
// Top-level model
// ---------------------------------------------------------------------------

export interface RenderEventPageModel {
  preset: EventPreset;
  sections: RenderEventSection[];
}
