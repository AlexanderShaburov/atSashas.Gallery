// features/public/eventPage/mapEventToRenderModel.ts
// Stage 5A: pure adapter from ResolvedEventPageData → RenderEventPageModel.
// No side effects, no mutation, no React, no business logic.
// Uses Stage 3 derived helpers and Stage 4 assembly for section ordering.

import type { Localized, Money } from '@/entities/common';
import {
  getExhibitionLayout,
  getExperienceLayout,
  getPleinAirCtaMetaLine,
  getPriceDisplay,
  getResultsLayout,
  getScarcityLabel,
  getWorkshopCtaMetaLine,
  splitExhibitionDescription,
} from '@/entities/event/eventDerived';
import type { EventRenderContext } from '@/entities/event/eventRenderContext';
import type {
  CaptionedWork,
  ResolvedEventPageData,
  ResolvedExhibitionEventPage,
  ResolvedMinimalEventPage,
  ResolvedPleinAirEventPage,
  ResolvedWorkshopEventPage,
} from '@/entities/event/eventPage.types';

import { assembleEventSections, getRenderedSections } from './assembleEventSections';
import type { RenderMode } from './assembleEventSections';
import { QUICK_FACTS_ITEMS } from './contracts';
import type { QuickFactItem, SectionKind } from './contracts';
import type {
  BridgeData,
  CtaBlockData,
  DescriptionData,
  FeaturedWorksData,
  GalleryExperienceData,
  GalleryResultsData,
  HeroCardData,
  HeroCinematicData,
  HeroEditorialData,
  HeroStandardData,
  HostNoteData,
  QuickFactRenderItem,
  QuickFactsData,
  RenderCaptionedWork,
  RenderEventPageModel,
  RenderEventSection,
  StickyCtaData,
  VisitCtaData,
} from './renderModel.types';

// ---------------------------------------------------------------------------
// Display helpers (presentation-only formatting)
// ---------------------------------------------------------------------------

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

function text(loc: Localized | undefined): string {
  if (!loc) return '';
  return loc.en ?? Object.values(loc).find((v) => v !== undefined) ?? '';
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const year = parts[0]!;
  const monthIndex = parseInt(parts[1]!, 10) - 1;
  const day = parseInt(parts[2]!, 10);
  const monthName = MONTHS[monthIndex];
  if (monthName === undefined || isNaN(day)) return iso;
  return `${monthName} ${day}, ${year}`;
}

function formatDateRange(start: string, end: string | undefined): string {
  if (!end) return formatDate(start);
  const sp = start.split('-');
  const ep = end.split('-');
  if (sp.length !== 3 || ep.length !== 3) return `${start} – ${end}`;

  const sYear = sp[0]!;
  const sMonth = parseInt(sp[1]!, 10) - 1;
  const sDay = parseInt(sp[2]!, 10);
  const eYear = ep[0]!;
  const eMonth = parseInt(ep[1]!, 10) - 1;
  const eDay = parseInt(ep[2]!, 10);

  const sMonthName = MONTHS[sMonth];
  const eMonthName = MONTHS[eMonth];
  if (!sMonthName || !eMonthName || isNaN(sDay) || isNaN(eDay)) {
    return `${start} – ${end}`;
  }

  if (sYear === eYear && sMonth === eMonth) {
    return `${sMonthName} ${sDay}–${eDay}, ${sYear}`;
  }
  return `${sMonthName} ${sDay} – ${eMonthName} ${eDay}, ${eYear}`;
}

// ---------------------------------------------------------------------------
// QuickFacts item formatting
// ---------------------------------------------------------------------------

function formatQuickFactValue(
  item: QuickFactItem,
  event: Record<string, unknown>,
  context: EventRenderContext,
): string | null {
  if (item.source === 'derived') {
    if (item.format === 'scarcity') {
      return getScarcityLabel(
        event['capacity'] as number | undefined,
        context.paidEnrollmentCount,
      ) ?? null;
    }
    return null;
  }

  const raw = event[item.source];

  switch (item.format) {
    case 'date':
      return typeof raw === 'string' ? formatDate(raw) : null;
    case 'dateRange': {
      if (typeof raw !== 'string') return null;
      const end = event['dateEnd'] as string | undefined;
      return formatDateRange(raw, end);
    }
    case 'localized':
      return text(raw as Localized | undefined) || null;
    case 'money':
      return getPriceDisplay(raw as Money | undefined);
    case 'maxN':
      return typeof raw === 'number' ? `Max ${raw}` : null;
    case 'scarcity':
      return getScarcityLabel(
        raw as number | undefined,
        context.paidEnrollmentCount,
      ) ?? null;
  }
}

function buildQuickFactItems(
  preset: 'workshop' | 'pleinAir',
  event: Record<string, unknown>,
  context: EventRenderContext,
): QuickFactRenderItem[] {
  const items = QUICK_FACTS_ITEMS[preset];
  const result: QuickFactRenderItem[] = [];

  for (const item of items) {
    const value = formatQuickFactValue(item, event, context);
    if (value !== null) {
      result.push({ label: item.labelKey, value });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Media URL resolution helpers
// ---------------------------------------------------------------------------

function resolveRef(ref: string | undefined, resolver: MediaUrlResolver | undefined): string | null {
  if (!ref) return null;
  if (!resolver) return ref;
  return resolver(ref) ?? ref;
}

function resolveRefs(refs: string[], resolver: MediaUrlResolver | undefined): string[] {
  if (!resolver) return refs;
  return refs.map((r) => resolver(r) ?? r);
}

// ---------------------------------------------------------------------------
// CaptionedWork flattening
// ---------------------------------------------------------------------------

function flattenCaptionedWork(work: CaptionedWork, resolver: MediaUrlResolver | undefined): RenderCaptionedWork {
  return {
    image: resolveRef(work.image, resolver) ?? work.image,
    title: text(work.title),
    medium: text(work.medium),
  };
}

// ---------------------------------------------------------------------------
// Per-section mappers
// ---------------------------------------------------------------------------

function mapHeroStandard(event: ResolvedWorkshopEventPage, r: MediaUrlResolver | undefined): HeroStandardData {
  return {
    title: text(event.title),
    subtitle: text(event.subtitle),
    heroImage: resolveRef(event.heroImage, r),
    priceDisplay: getPriceDisplay(event.price),
    dateDisplay: formatDate(event.dateStart),
  };
}

function mapHeroCinematic(event: ResolvedPleinAirEventPage, r: MediaUrlResolver | undefined): HeroCinematicData {
  return {
    title: text(event.title),
    subtitle: text(event.subtitle),
    heroImage: resolveRef(event.heroImage, r),
    eyebrow: text(event.eyebrow),
  };
}

function mapHeroEditorial(event: ResolvedExhibitionEventPage, r: MediaUrlResolver | undefined): HeroEditorialData {
  return {
    title: text(event.title),
    heroImage: resolveRef(event.heroImage, r),
    eyebrow: text(event.eyebrow),
    dateDisplay: formatDateRange(event.dateStart ?? '', event.dateEnd),
  };
}

function mapHeroCard(event: ResolvedMinimalEventPage, r: MediaUrlResolver | undefined): HeroCardData {
  return {
    title: text(event.title),
    description: text(event.description),
    dateDisplay: formatDateRange(event.dateStart ?? '', event.dateEnd),
    location: text(event.location),
    ctaLabel: text(event.ctaLabel),
    heroImage: resolveRef(event.heroImage, r),
    time: event.time ?? '',
    priceDisplay: getPriceDisplay(event.price),
    eyebrow: text(event.eyebrow),
  };
}

function mapBridge(event: ResolvedPleinAirEventPage): BridgeData {
  return { text: text(event.bridgeLine) };
}

function mapQuickFacts(
  event: ResolvedEventPageData,
  context: EventRenderContext,
): QuickFactsData {
  const preset = event.preset as 'workshop' | 'pleinAir';
  const record = event as unknown as Record<string, unknown>;
  return { items: buildQuickFactItems(preset, record, context) };
}

function mapDescription(
  event: ResolvedEventPageData,
  sourceFieldOverride: string | undefined,
): DescriptionData {
  const record = event as unknown as Record<string, unknown>;
  const field = sourceFieldOverride ?? 'description';
  const rawText = text(record[field] as Localized | undefined);

  const label = 'descriptionLabel' in event
    ? text((event as ResolvedExhibitionEventPage).descriptionLabel)
    : '';

  const { thesisLine, bodyParagraphs } = splitExhibitionDescription(rawText);

  return { label, text: rawText, thesisLine, bodyParagraphs };
}

function mapHostNote(event: ResolvedEventPageData): HostNoteData {
  const record = event as unknown as Record<string, unknown>;
  return {
    label: text(record['hostNoteLabel'] as Localized | undefined),
    note: text(record['hostNote'] as Localized | undefined),
    hostName: (record['hostName'] as string | undefined) ?? '',
  };
}

function mapGalleryExperience(event: ResolvedEventPageData, r: MediaUrlResolver | undefined): GalleryExperienceData {
  const record = event as unknown as Record<string, unknown>;
  const images = (record['experienceImages'] as string[] | undefined) ?? [];
  return {
    title: text(record['experienceTitle'] as Localized | undefined),
    images: resolveRefs(images, r),
    layout: getExperienceLayout(images, event.preset) ?? null,
  };
}

function mapGalleryResults(event: ResolvedEventPageData, r: MediaUrlResolver | undefined): GalleryResultsData {
  const record = event as unknown as Record<string, unknown>;
  const images = (record['resultsImages'] as string[] | undefined) ?? [];
  return {
    title: text(record['resultsTitle'] as Localized | undefined),
    images: resolveRefs(images, r),
    layout: getResultsLayout(images) ?? null,
  };
}

function mapFeaturedWorks(event: ResolvedExhibitionEventPage, r: MediaUrlResolver | undefined): FeaturedWorksData {
  const works = event.featuredWorks ?? [];
  return {
    title: text(event.featuredWorksTitle),
    works: works.map((w) => flattenCaptionedWork(w, r)),
    layout: getExhibitionLayout(works) ?? null,
  };
}

function mapCtaBlock(
  event: ResolvedEventPageData,
  context: EventRenderContext,
): CtaBlockData {
  const record = event as unknown as Record<string, unknown>;
  const capacity = record['capacity'] as number | undefined;

  let metaLine: string;
  if (event.preset === 'pleinAir') {
    const pa = event as ResolvedPleinAirEventPage;
    metaLine = getPleinAirCtaMetaLine(pa.dateStart, pa.dateEnd, pa.location, pa.price);
  } else {
    const ws = event as ResolvedWorkshopEventPage;
    metaLine = getWorkshopCtaMetaLine(ws.dateStart, ws.duration, ws.price);
  }

  return {
    bridgeText: text(record['ctaBridge'] as Localized | undefined),
    ctaLabel: text(event.ctaLabel),
    metaLine,
    scarcityLabel: getScarcityLabel(capacity, context.paidEnrollmentCount) ?? null,
    cancellationNote: text(record['cancellationNote'] as Localized | undefined),
  };
}

function mapVisitCta(event: ResolvedExhibitionEventPage): VisitCtaData {
  const dateDisplay = formatDateRange(event.dateStart ?? '', event.dateEnd);
  let openingDisplay = '';
  if (event.openingDate) {
    openingDisplay = formatDate(event.openingDate);
    if (event.openingTime) {
      openingDisplay += `, ${event.openingTime}`;
    }
  }

  return {
    dateDisplay,
    hours: text(event.hours),
    location: text(event.location),
    admission: text(event.admission),
    ctaLabel: text(event.ctaLabel),
    openingDisplay,
    secondaryAction: text(event.secondaryAction),
  };
}

function mapStickyCta(
  event: ResolvedPleinAirEventPage,
  context: EventRenderContext,
): StickyCtaData {
  return {
    priceDisplay: getPriceDisplay(event.price),
    dateDisplay: formatDateRange(event.dateStart ?? '', event.dateEnd),
    groupSizeDisplay: event.groupSize !== undefined ? `Max ${event.groupSize}` : '',
    ctaLabel: text(event.ctaLabel),
    scarcityLabel: getScarcityLabel(event.groupSize, context.paidEnrollmentCount) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Section description override lookup
// ---------------------------------------------------------------------------

import { PRESET_SECTION_MAP } from './contracts';

function getSourceFieldOverride(preset: string, sectionKind: SectionKind): string | undefined {
  const sections = PRESET_SECTION_MAP[preset];
  if (!sections) return undefined;
  const slot = sections.find((s) => s.section === sectionKind);
  return slot?.sourceFieldOverride;
}

// ---------------------------------------------------------------------------
// Main mapper
// ---------------------------------------------------------------------------

/** Resolves a MediaRef (ID) to a displayable image URL. Returns null if unresolvable. */
export type MediaUrlResolver = (ref: string) => string | null;

export interface MapEventOptions {
  mode?: RenderMode;
  /** When provided, MediaRef IDs are resolved to image URLs in the render model. */
  resolveMediaUrl?: MediaUrlResolver;
}

export function mapEventToRenderModel(
  event: ResolvedEventPageData,
  context: EventRenderContext,
  options?: MapEventOptions,
): RenderEventPageModel {
  const mode = options?.mode ?? 'production';
  const resolver = options?.resolveMediaUrl;
  const allOutputs = assembleEventSections(event, context, { mode });
  const rendered = getRenderedSections(allOutputs);

  const sections: RenderEventSection[] = [];

  for (const output of rendered) {
    if (output.status !== 'rendered') continue;

    const section = mapSection(output.kind, event, context, resolver);
    if (section) {
      sections.push(section);
    }
  }

  return { preset: event.preset, sections };
}

function mapSection(
  kind: SectionKind,
  event: ResolvedEventPageData,
  context: EventRenderContext,
  r: MediaUrlResolver | undefined,
): RenderEventSection | null {
  switch (kind) {
    case 'heroStandard':
      return { kind, data: mapHeroStandard(event as ResolvedWorkshopEventPage, r) };
    case 'heroCinematic':
      return { kind, data: mapHeroCinematic(event as ResolvedPleinAirEventPage, r) };
    case 'heroEditorial':
      return { kind, data: mapHeroEditorial(event as ResolvedExhibitionEventPage, r) };
    case 'heroCard':
      return { kind, data: mapHeroCard(event as ResolvedMinimalEventPage, r) };
    case 'bridge':
      return { kind, data: mapBridge(event as ResolvedPleinAirEventPage) };
    case 'quickFacts':
      return { kind, data: mapQuickFacts(event, context) };
    case 'description':
      return {
        kind,
        data: mapDescription(event, getSourceFieldOverride(event.preset, kind)),
      };
    case 'hostNote':
      return { kind, data: mapHostNote(event) };
    case 'galleryExperience':
      return { kind, data: mapGalleryExperience(event, r) };
    case 'galleryResults':
      return { kind, data: mapGalleryResults(event, r) };
    case 'featuredWorks':
      return { kind, data: mapFeaturedWorks(event as ResolvedExhibitionEventPage, r) };
    case 'ctaBlock':
      return { kind, data: mapCtaBlock(event, context) };
    case 'visitCta':
      return { kind, data: mapVisitCta(event as ResolvedExhibitionEventPage) };
    case 'stickyCta':
      return { kind, data: mapStickyCta(event as ResolvedPleinAirEventPage, context) };
  }
}
