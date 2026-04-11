// features/public/eventPage/contracts.ts
// Section contracts, preset section arrays, and QuickFacts field mappings.
// Source of truth: Docs/EVENT_PAGE_FINALIZATION.md §1

import type { Localized } from '@/entities/common';

// ---------------------------------------------------------------------------
// Section kinds
// ---------------------------------------------------------------------------

export type SectionKind =
  | 'heroStandard'
  | 'heroCinematic'
  | 'heroEditorial'
  | 'heroCard'
  | 'bridge'
  | 'quickFacts'
  | 'description'
  | 'hostNote'
  | 'galleryExperience'
  | 'galleryResults'
  | 'featuredWorks'
  | 'ctaBlock'
  | 'visitCta'
  | 'stickyCta';

// ---------------------------------------------------------------------------
// Section contract
// ---------------------------------------------------------------------------

export interface SectionContract {
  kind: SectionKind;
  sourceFields: string[];
  optionalFields?: string[];
  resolvedDefaults?: string[];
  derivedValues?: string[];
}

export const SECTION_CONTRACTS: Record<SectionKind, SectionContract> = {
  heroStandard: {
    kind: 'heroStandard',
    sourceFields: ['title', 'subtitle', 'heroImage', 'price', 'dateStart'],
  },
  heroCinematic: {
    kind: 'heroCinematic',
    sourceFields: ['title', 'subtitle', 'heroImage'],
    resolvedDefaults: ['eyebrow'],
  },
  heroEditorial: {
    kind: 'heroEditorial',
    sourceFields: ['title', 'heroImage', 'dateStart', 'dateEnd'],
    resolvedDefaults: ['eyebrow'],
  },
  heroCard: {
    kind: 'heroCard',
    sourceFields: ['title', 'description', 'dateStart', 'location', 'ctaLabel'],
    optionalFields: ['heroImage', 'dateEnd', 'time', 'price'],
    resolvedDefaults: ['eyebrow'],
    derivedValues: ['priceDisplay'],
  },
  bridge: {
    kind: 'bridge',
    sourceFields: ['bridgeLine'],
  },
  quickFacts: {
    kind: 'quickFacts',
    // Source fields are preset-specific. See QUICK_FACTS_SOURCES below.
    // The assembler overrides this with the correct list per preset.
    sourceFields: [],
    derivedValues: ['scarcityLabel'],
  },
  description: {
    kind: 'description',
    // Standard variant reads 'description'. Minimal extended reads 'extendedDescription'.
    // The assembler uses sourceFieldOverride from PresetSectionSlot when present.
    sourceFields: ['description'],
    resolvedDefaults: ['descriptionLabel'],
    derivedValues: ['thesisLine', 'bodyParagraphs'],
  },
  hostNote: {
    kind: 'hostNote',
    sourceFields: ['hostNote'],
    optionalFields: ['hostName'],
    resolvedDefaults: ['hostNoteLabel'],
  },
  galleryExperience: {
    kind: 'galleryExperience',
    sourceFields: ['experienceImages'],
    resolvedDefaults: ['experienceTitle'],
    derivedValues: ['experienceLayout'],
  },
  galleryResults: {
    kind: 'galleryResults',
    sourceFields: ['resultsImages'],
    resolvedDefaults: ['resultsTitle'],
    derivedValues: ['resultsLayout'],
  },
  featuredWorks: {
    kind: 'featuredWorks',
    sourceFields: ['featuredWorks'],
    resolvedDefaults: ['featuredWorksTitle'],
    derivedValues: ['exhibitionLayout'],
  },
  ctaBlock: {
    kind: 'ctaBlock',
    sourceFields: ['ctaBridge', 'ctaLabel', 'dateStart', 'price'],
    optionalFields: ['cancellationNote', 'dateEnd', 'duration', 'location'],
    derivedValues: ['ctaMetaLine', 'scarcityLabel'],
  },
  visitCta: {
    kind: 'visitCta',
    sourceFields: ['dateStart', 'dateEnd', 'hours', 'location', 'admission', 'ctaLabel'],
    optionalFields: ['openingDate', 'openingTime'],
    resolvedDefaults: ['secondaryAction'],
  },
  stickyCta: {
    kind: 'stickyCta',
    sourceFields: ['price', 'dateStart', 'groupSize', 'ctaLabel'],
    derivedValues: ['stickyCtaLine', 'scarcityLabel'],
  },
};

// ---------------------------------------------------------------------------
// QuickFacts preset-specific source fields
// ---------------------------------------------------------------------------

export type QuickFactFormat = 'date' | 'dateRange' | 'localized' | 'money' | 'scarcity' | 'maxN';

export interface QuickFactItem {
  labelKey: string; // i18n key, NOT stored in event data
  source: string | 'derived';
  format: QuickFactFormat;
}

export const QUICK_FACTS_ITEMS: Record<'workshop' | 'pleinAir', QuickFactItem[]> = {
  workshop: [
    { labelKey: 'date', source: 'dateStart', format: 'date' },
    { labelKey: 'duration', source: 'duration', format: 'localized' },
    { labelKey: 'location', source: 'location', format: 'localized' },
    { labelKey: 'price', source: 'price', format: 'money' },
    { labelKey: 'spots', source: 'derived', format: 'scarcity' },
  ],
  pleinAir: [
    { labelKey: 'dates', source: 'dateStart', format: 'dateRange' },
    { labelKey: 'sessions', source: 'sessions', format: 'localized' },
    { labelKey: 'meetingPoint', source: 'meetingPoint', format: 'localized' },
    { labelKey: 'groupSize', source: 'groupSize', format: 'maxN' },
    { labelKey: 'price', source: 'price', format: 'money' },
  ],
};

/** Source fields needed for QuickFacts per preset. */
export const QUICK_FACTS_SOURCES: Record<'workshop' | 'pleinAir', string[]> = {
  workshop: ['dateStart', 'duration', 'location', 'price'],
  pleinAir: ['dateStart', 'sessions', 'meetingPoint', 'location', 'groupSize', 'price'],
};

// ---------------------------------------------------------------------------
// Preset section definitions
// ---------------------------------------------------------------------------

export type SectionImportance = 'required' | 'strong' | 'optional';

export interface PresetSectionSlot {
  section: SectionKind;
  importance: SectionImportance;
  /** When set, the section reads this field instead of its contract's default sourceFields[0]. */
  sourceFieldOverride?: string;
}

export type PresetSectionArray = readonly PresetSectionSlot[];

export const WORKSHOP_SECTIONS: PresetSectionArray = [
  { section: 'heroStandard', importance: 'required' },
  { section: 'quickFacts', importance: 'required' },
  { section: 'description', importance: 'required' },
  { section: 'hostNote', importance: 'strong' },
  { section: 'galleryExperience', importance: 'strong' },
  { section: 'galleryResults', importance: 'strong' },
  { section: 'ctaBlock', importance: 'required' },
];

export const PLEIN_AIR_SECTIONS: PresetSectionArray = [
  { section: 'heroCinematic', importance: 'required' },
  { section: 'bridge', importance: 'required' },
  { section: 'description', importance: 'required' },
  { section: 'galleryExperience', importance: 'required' },
  { section: 'hostNote', importance: 'strong' },
  { section: 'galleryResults', importance: 'optional' },
  { section: 'quickFacts', importance: 'required' },
  { section: 'ctaBlock', importance: 'required' },
  { section: 'stickyCta', importance: 'required' },
];

export const EXHIBITION_SECTIONS: PresetSectionArray = [
  { section: 'heroEditorial', importance: 'required' },
  { section: 'description', importance: 'required' },
  { section: 'featuredWorks', importance: 'required' },
  { section: 'hostNote', importance: 'optional' },
  { section: 'visitCta', importance: 'required' },
];

export const MINIMAL_SECTIONS: PresetSectionArray = [
  { section: 'heroCard', importance: 'required' },
  { section: 'description', importance: 'optional', sourceFieldOverride: 'extendedDescription' },
];

export const PRESET_SECTION_MAP: Record<string, PresetSectionArray> = {
  workshop: WORKSHOP_SECTIONS,
  pleinAir: PLEIN_AIR_SECTIONS,
  exhibition: EXHIBITION_SECTIONS,
  minimal: MINIMAL_SECTIONS,
};
