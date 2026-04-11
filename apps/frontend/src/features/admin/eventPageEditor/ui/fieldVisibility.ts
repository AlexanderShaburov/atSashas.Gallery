// features/admin/eventPageEditor/ui/fieldVisibility.ts
// Static preset × field visibility map.
// Single source of truth for which fields appear per preset.
// Derived from: Authoring Contract §4, EventPageData types.

import type { EventPreset } from '@/entities/event';

// ---------------------------------------------------------------------------
// Field keys grouped by editor section
// ---------------------------------------------------------------------------

export const CONTENT_FIELDS = [
  'title',
  'subtitle',
  'description',
  'extendedDescription',
  'bridgeLine',
  'hostNote',
  'hostName',
] as const;

export const LOGISTICS_FIELDS = [
  'dateStart',
  'dateEnd',
  'duration',
  'time',
  'sessions',
  'location',
  'meetingPoint',
  'mapUrl',
  'price',
  'capacity',
  'groupSize',
  'openingDate',
  'openingTime',
  'hours',
  'admission',
] as const;

export const CTA_FIELDS = [
  'ctaLabel',
  'ctaBridge',
  'cancellationNote',
  'secondaryAction',
] as const;

export const MEDIA_FIELDS = [
  'heroImage',
  'experienceImages',
  'resultsImages',
  'featuredWorks',
] as const;

export const LABEL_OVERRIDE_FIELDS = [
  'eyebrow',
  'experienceTitle',
  'resultsTitle',
  'featuredWorksTitle',
  'descriptionLabel',
  'hostNoteLabel',
] as const;

// ---------------------------------------------------------------------------
// Visibility map
// ---------------------------------------------------------------------------

type AllFieldKeys =
  | (typeof CONTENT_FIELDS)[number]
  | (typeof LOGISTICS_FIELDS)[number]
  | (typeof CTA_FIELDS)[number]
  | (typeof MEDIA_FIELDS)[number]
  | (typeof LABEL_OVERRIDE_FIELDS)[number];

// true = visible for this preset
const V: Record<EventPreset, Record<AllFieldKeys, boolean>> = {
  workshop: {
    // Content
    title: true, subtitle: true, description: true, extendedDescription: false,
    bridgeLine: false, hostNote: true, hostName: true,
    // Logistics
    dateStart: true, dateEnd: false, duration: true, time: false, sessions: false,
    location: true, meetingPoint: false, mapUrl: true,
    price: true, capacity: true, groupSize: false,
    openingDate: false, openingTime: false, hours: false, admission: false,
    // CTA
    ctaLabel: true, ctaBridge: true, cancellationNote: true, secondaryAction: false,
    // Media
    heroImage: true, experienceImages: true, resultsImages: true, featuredWorks: false,
    // Label overrides
    eyebrow: false, experienceTitle: true, resultsTitle: true,
    featuredWorksTitle: false, descriptionLabel: false, hostNoteLabel: true,
  },
  pleinAir: {
    // Content
    title: true, subtitle: true, description: true, extendedDescription: false,
    bridgeLine: true, hostNote: true, hostName: true,
    // Logistics
    dateStart: true, dateEnd: true, duration: false, time: false, sessions: true,
    location: true, meetingPoint: true, mapUrl: true,
    price: true, capacity: false, groupSize: true,
    openingDate: false, openingTime: false, hours: false, admission: false,
    // CTA
    ctaLabel: true, ctaBridge: true, cancellationNote: true, secondaryAction: false,
    // Media
    heroImage: true, experienceImages: true, resultsImages: true, featuredWorks: false,
    // Label overrides
    eyebrow: true, experienceTitle: true, resultsTitle: true,
    featuredWorksTitle: false, descriptionLabel: false, hostNoteLabel: true,
  },
  exhibition: {
    // Content
    title: true, subtitle: false, description: true, extendedDescription: false,
    bridgeLine: false, hostNote: true, hostName: true,
    // Logistics
    dateStart: true, dateEnd: true, duration: false, time: false, sessions: false,
    location: true, meetingPoint: false, mapUrl: false,
    price: false, capacity: false, groupSize: false,
    openingDate: true, openingTime: true, hours: true, admission: true,
    // CTA
    ctaLabel: true, ctaBridge: false, cancellationNote: false, secondaryAction: true,
    // Media
    heroImage: true, experienceImages: false, resultsImages: false, featuredWorks: true,
    // Label overrides
    eyebrow: true, experienceTitle: false, resultsTitle: false,
    featuredWorksTitle: true, descriptionLabel: true, hostNoteLabel: true,
  },
  minimal: {
    // Content
    title: true, subtitle: false, description: true, extendedDescription: true,
    bridgeLine: false, hostNote: false, hostName: false,
    // Logistics
    dateStart: true, dateEnd: true, duration: false, time: true, sessions: false,
    location: true, meetingPoint: false, mapUrl: true,
    price: true, capacity: false, groupSize: false,
    openingDate: false, openingTime: false, hours: false, admission: false,
    // CTA
    ctaLabel: true, ctaBridge: false, cancellationNote: false, secondaryAction: false,
    // Media
    heroImage: true, experienceImages: false, resultsImages: false, featuredWorks: false,
    // Label overrides
    eyebrow: true, experienceTitle: false, resultsTitle: false,
    featuredWorksTitle: false, descriptionLabel: false, hostNoteLabel: false,
  },
};

export function isFieldVisible(preset: EventPreset, field: AllFieldKeys): boolean {
  return V[preset][field];
}

export { V as FIELD_VISIBILITY };
export type { AllFieldKeys };
