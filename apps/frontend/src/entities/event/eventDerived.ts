// entities/event/eventDerived.ts
// Pure derived value helpers for event page rendering.
// No UI logic, no mutation, no storage writes, no side effects.
// Source of truth: Docs/EVENT_PAGE_FINALIZATION.md §5

import type { CurrencyName, Localized, Money } from '@/entities/common';

import type { CaptionedWork, EventPreset, MediaRef } from './eventPage.types';

// ---------------------------------------------------------------------------
// Layout types (from spec §3.2)
// ---------------------------------------------------------------------------

export type ExperienceLayout = 'exp-1' | 'exp-2' | 'exp-3' | 'exp-4' | 'exp-pleinair';
export type ResultsLayout = 'res-2' | 'res-3';
export type ExhibitionLayout = 'exhibition';

// ---------------------------------------------------------------------------
// Price display
// ---------------------------------------------------------------------------

const CURRENCY_SYMBOLS: Record<CurrencyName, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  ILS: '₪',
  CHF: 'CHF ',
  JPY: '¥',
  CNY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
};

/**
 * Formats a price for display.
 * - `undefined` or zero amount → `"Free"`
 * - Otherwise → symbol + amount, e.g. `"€45"`, `"$120"`
 */
export function getPriceDisplay(price: Money | undefined): string {
  if (price === undefined || price.amount === 0) return 'Free';
  const symbol = CURRENCY_SYMBOLS[price.currency] ?? price.currency;
  return `${symbol}${price.amount}`;
}

// ---------------------------------------------------------------------------
// Scarcity label
// ---------------------------------------------------------------------------

/**
 * Computes a scarcity label from total capacity and paid enrollment count.
 *
 * Returns `undefined` when scarcity display is not appropriate:
 * - no capacity set
 * - no spots taken yet (remaining === total)
 *
 * Format: "X of Y spots remaining" or "Sold out".
 */
export function getScarcityLabel(
  totalCapacity: number | undefined,
  paidEnrollmentCount: number,
): string | undefined {
  if (totalCapacity === undefined) return undefined;

  const remaining = totalCapacity - paidEnrollmentCount;

  if (remaining <= 0) return 'Sold out';
  if (remaining >= totalCapacity) return undefined;

  return `${remaining} of ${totalCapacity} spots remaining`;
}

// ---------------------------------------------------------------------------
// CTA meta line
// ---------------------------------------------------------------------------

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Formats "YYYY-MM-DD" → "May 17, 2026". Returns the raw string if parsing fails. */
function formatDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = parts[0]!;
  const monthIndex = parseInt(parts[1]!, 10) - 1;
  const day = parseInt(parts[2]!, 10);
  const monthName = MONTHS[monthIndex];
  if (monthName === undefined || isNaN(day)) return isoDate;
  return `${monthName} ${day}, ${year}`;
}

/** Formats a date range: "June 14–15, 2026" (same month) or "June 14 – July 2, 2026". */
function formatDateRange(start: string, end: string): string {
  const startParts = start.split('-');
  const endParts = end.split('-');
  if (startParts.length !== 3 || endParts.length !== 3) return `${start} – ${end}`;

  const sYear = startParts[0]!;
  const sMonth = parseInt(startParts[1]!, 10) - 1;
  const sDay = parseInt(startParts[2]!, 10);
  const eYear = endParts[0]!;
  const eMonth = parseInt(endParts[1]!, 10) - 1;
  const eDay = parseInt(endParts[2]!, 10);

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

function localizedValue(loc: Localized | undefined): string {
  if (!loc) return '';
  return loc.en ?? Object.values(loc).find((v) => v !== undefined) ?? '';
}

/**
 * Workshop CTA meta line.
 * Format: "May 17, 2026 · 3 hours · €45 per person"
 */
export function getWorkshopCtaMetaLine(
  dateStart: string | undefined,
  duration: Localized | undefined,
  price: Money | undefined,
): string {
  const parts: string[] = [];
  if (dateStart) parts.push(formatDate(dateStart));
  const dur = localizedValue(duration);
  if (dur) parts.push(dur);
  if (price && price.amount > 0) parts.push(`${getPriceDisplay(price)} per person`);
  return parts.join(' · ');
}

/**
 * Plein Air CTA meta line.
 * Format: "June 14–15, 2026 · Camogli, Liguria · €120 per person"
 */
export function getPleinAirCtaMetaLine(
  dateStart: string | undefined,
  dateEnd: string | undefined,
  location: Localized | undefined,
  price: Money | undefined,
): string {
  const parts: string[] = [];
  if (dateStart) {
    parts.push(dateEnd ? formatDateRange(dateStart, dateEnd) : formatDate(dateStart));
  }
  const loc = localizedValue(location);
  if (loc) parts.push(loc);
  if (price && price.amount > 0) parts.push(`${getPriceDisplay(price)} per person`);
  return parts.join(' · ');
}

// ---------------------------------------------------------------------------
// Gallery layout selection
// ---------------------------------------------------------------------------

const WORKSHOP_EXPERIENCE_LAYOUTS: Record<number, ExperienceLayout> = {
  1: 'exp-1',
  2: 'exp-2',
  3: 'exp-3',
  4: 'exp-4',
};

/**
 * Selects the experience gallery layout variant based on image count and preset.
 * Returns `undefined` if the count is invalid for the preset.
 */
export function getExperienceLayout(
  images: MediaRef[] | undefined,
  preset: EventPreset,
): ExperienceLayout | undefined {
  if (!images || images.length === 0) return undefined;

  if (preset === 'pleinAir') {
    return images.length >= 3 && images.length <= 4 ? 'exp-pleinair' : undefined;
  }

  return WORKSHOP_EXPERIENCE_LAYOUTS[images.length];
}

/**
 * Selects the results gallery layout variant.
 * Returns `undefined` if the count is invalid.
 */
export function getResultsLayout(images: MediaRef[] | undefined): ResultsLayout | undefined {
  if (!images) return undefined;
  if (images.length === 2) return 'res-2';
  if (images.length === 3) return 'res-3';
  return undefined;
}

/**
 * Selects the exhibition gallery layout variant.
 * Returns `undefined` if the count is outside 4–6.
 */
export function getExhibitionLayout(
  featuredWorks: CaptionedWork[] | undefined,
): ExhibitionLayout | undefined {
  if (!featuredWorks) return undefined;
  return featuredWorks.length >= 4 && featuredWorks.length <= 6 ? 'exhibition' : undefined;
}

// ---------------------------------------------------------------------------
// Exhibition description split
// ---------------------------------------------------------------------------

/**
 * Splits an exhibition description into thesis line (first paragraph)
 * and body paragraphs (remainder).
 *
 * Paragraphs are separated by double newlines (\n\n).
 * If only one paragraph exists, bodyParagraphs is empty string.
 */
export function splitExhibitionDescription(description: string): {
  thesisLine: string;
  bodyParagraphs: string;
} {
  const trimmed = description.trim();
  if (trimmed === '') return { thesisLine: '', bodyParagraphs: '' };

  const splitIndex = trimmed.indexOf('\n\n');
  if (splitIndex === -1) return { thesisLine: trimmed, bodyParagraphs: '' };

  return {
    thesisLine: trimmed.slice(0, splitIndex).trim(),
    bodyParagraphs: trimmed.slice(splitIndex + 2).trim(),
  };
}
