import { describe, expect, it } from 'vitest';

import type { Money } from '@/entities/common';

import {
  getExhibitionLayout,
  getExperienceLayout,
  getPleinAirCtaMetaLine,
  getPriceDisplay,
  getResultsLayout,
  getScarcityLabel,
  getWorkshopCtaMetaLine,
  splitExhibitionDescription,
} from '../eventDerived';
import type { CaptionedWork } from '../eventPage.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWorks(n: number): CaptionedWork[] {
  return Array.from({ length: n }, (_, i) => ({
    image: `img-${i}`,
    title: { en: `Work ${i}` },
  }));
}

function makeImages(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `img-${i}`);
}

// ---------------------------------------------------------------------------
// B. getPriceDisplay
// ---------------------------------------------------------------------------

describe('getPriceDisplay', () => {
  it('undefined → "Free"', () => {
    expect(getPriceDisplay(undefined)).toBe('Free');
  });

  it('amount 0 → "Free"', () => {
    expect(getPriceDisplay({ amount: 0, currency: 'EUR' })).toBe('Free');
  });

  it('EUR 45 → "€45"', () => {
    expect(getPriceDisplay({ amount: 45, currency: 'EUR' })).toBe('€45');
  });

  it('USD 120 → "$120"', () => {
    expect(getPriceDisplay({ amount: 120, currency: 'USD' })).toBe('$120');
  });

  it('GBP 30 → "£30"', () => {
    expect(getPriceDisplay({ amount: 30, currency: 'GBP' })).toBe('£30');
  });

  it('ILS 50 → "₪50"', () => {
    expect(getPriceDisplay({ amount: 50, currency: 'ILS' })).toBe('₪50');
  });

  it('CHF 80 → "CHF 80"', () => {
    expect(getPriceDisplay({ amount: 80, currency: 'CHF' })).toBe('CHF 80');
  });
});

// ---------------------------------------------------------------------------
// C. getScarcityLabel
// ---------------------------------------------------------------------------

describe('getScarcityLabel', () => {
  it('no capacity → undefined', () => {
    expect(getScarcityLabel(undefined, 5)).toBeUndefined();
  });

  it('total 10, paid 0 → undefined (no scarcity to show)', () => {
    expect(getScarcityLabel(10, 0)).toBeUndefined();
  });

  it('total 10, paid 7 → "3 of 10 spots remaining"', () => {
    expect(getScarcityLabel(10, 7)).toBe('3 of 10 spots remaining');
  });

  it('total 10, paid 10 → "Sold out"', () => {
    expect(getScarcityLabel(10, 10)).toBe('Sold out');
  });

  it('total 6, paid 8 (oversold) → "Sold out"', () => {
    expect(getScarcityLabel(6, 8)).toBe('Sold out');
  });

  it('total 8, paid 1 → "7 of 8 spots remaining"', () => {
    expect(getScarcityLabel(8, 1)).toBe('7 of 8 spots remaining');
  });
});

// ---------------------------------------------------------------------------
// CTA meta lines
// ---------------------------------------------------------------------------

describe('getWorkshopCtaMetaLine', () => {
  it('formats full workshop meta line', () => {
    const result = getWorkshopCtaMetaLine(
      '2026-05-17',
      { en: '3 hours' },
      { amount: 45, currency: 'EUR' },
    );
    expect(result).toBe('May 17, 2026 · 3 hours · €45 per person');
  });

  it('handles missing duration', () => {
    const result = getWorkshopCtaMetaLine('2026-05-17', undefined, { amount: 45, currency: 'EUR' });
    expect(result).toBe('May 17, 2026 · €45 per person');
  });

  it('handles missing price', () => {
    const result = getWorkshopCtaMetaLine('2026-05-17', { en: '3 hours' }, undefined);
    expect(result).toBe('May 17, 2026 · 3 hours');
  });

  it('handles missing date', () => {
    const result = getWorkshopCtaMetaLine(undefined, { en: '3 hours' }, {
      amount: 45,
      currency: 'EUR',
    });
    expect(result).toBe('3 hours · €45 per person');
  });

  it('handles free event (price amount 0)', () => {
    const result = getWorkshopCtaMetaLine('2026-05-17', { en: '3 hours' }, {
      amount: 0,
      currency: 'EUR',
    });
    expect(result).toBe('May 17, 2026 · 3 hours');
  });
});

describe('getPleinAirCtaMetaLine', () => {
  it('formats full plein air meta line with date range', () => {
    const result = getPleinAirCtaMetaLine(
      '2026-06-14',
      '2026-06-15',
      { en: 'Camogli, Liguria' },
      { amount: 120, currency: 'EUR' },
    );
    expect(result).toBe('June 14–15, 2026 · Camogli, Liguria · €120 per person');
  });

  it('formats single-day plein air', () => {
    const result = getPleinAirCtaMetaLine(
      '2026-06-14',
      undefined,
      { en: 'Camogli, Liguria' },
      { amount: 120, currency: 'EUR' },
    );
    expect(result).toBe('June 14, 2026 · Camogli, Liguria · €120 per person');
  });

  it('formats cross-month date range', () => {
    const result = getPleinAirCtaMetaLine(
      '2026-06-28',
      '2026-07-02',
      { en: 'Tuscany' },
      { amount: 200, currency: 'EUR' },
    );
    expect(result).toBe('June 28 – July 2, 2026 · Tuscany · €200 per person');
  });

  it('handles missing location', () => {
    const result = getPleinAirCtaMetaLine('2026-06-14', '2026-06-15', undefined, {
      amount: 120,
      currency: 'EUR',
    });
    expect(result).toBe('June 14–15, 2026 · €120 per person');
  });
});

// ---------------------------------------------------------------------------
// D. getExperienceLayout
// ---------------------------------------------------------------------------

describe('getExperienceLayout', () => {
  it('workshop: 1 image → exp-1', () => {
    expect(getExperienceLayout(makeImages(1), 'workshop')).toBe('exp-1');
  });

  it('workshop: 2 images → exp-2', () => {
    expect(getExperienceLayout(makeImages(2), 'workshop')).toBe('exp-2');
  });

  it('workshop: 3 images → exp-3', () => {
    expect(getExperienceLayout(makeImages(3), 'workshop')).toBe('exp-3');
  });

  it('workshop: 4 images → exp-4', () => {
    expect(getExperienceLayout(makeImages(4), 'workshop')).toBe('exp-4');
  });

  it('workshop: 5 images → undefined (invalid)', () => {
    expect(getExperienceLayout(makeImages(5), 'workshop')).toBeUndefined();
  });

  it('workshop: 0 images → undefined', () => {
    expect(getExperienceLayout([], 'workshop')).toBeUndefined();
  });

  it('workshop: undefined → undefined', () => {
    expect(getExperienceLayout(undefined, 'workshop')).toBeUndefined();
  });

  it('pleinAir: 3 images → exp-pleinair', () => {
    expect(getExperienceLayout(makeImages(3), 'pleinAir')).toBe('exp-pleinair');
  });

  it('pleinAir: 4 images → exp-pleinair', () => {
    expect(getExperienceLayout(makeImages(4), 'pleinAir')).toBe('exp-pleinair');
  });

  it('pleinAir: 2 images → undefined (invalid)', () => {
    expect(getExperienceLayout(makeImages(2), 'pleinAir')).toBeUndefined();
  });

  it('pleinAir: 5 images → undefined (invalid)', () => {
    expect(getExperienceLayout(makeImages(5), 'pleinAir')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// E. getResultsLayout
// ---------------------------------------------------------------------------

describe('getResultsLayout', () => {
  it('2 images → res-2', () => {
    expect(getResultsLayout(makeImages(2))).toBe('res-2');
  });

  it('3 images → res-3', () => {
    expect(getResultsLayout(makeImages(3))).toBe('res-3');
  });

  it('1 image → undefined', () => {
    expect(getResultsLayout(makeImages(1))).toBeUndefined();
  });

  it('4 images → undefined', () => {
    expect(getResultsLayout(makeImages(4))).toBeUndefined();
  });

  it('undefined → undefined', () => {
    expect(getResultsLayout(undefined)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// F. getExhibitionLayout
// ---------------------------------------------------------------------------

describe('getExhibitionLayout', () => {
  it('4 works → exhibition', () => {
    expect(getExhibitionLayout(makeWorks(4))).toBe('exhibition');
  });

  it('5 works → exhibition', () => {
    expect(getExhibitionLayout(makeWorks(5))).toBe('exhibition');
  });

  it('6 works → exhibition', () => {
    expect(getExhibitionLayout(makeWorks(6))).toBe('exhibition');
  });

  it('3 works → undefined (too few)', () => {
    expect(getExhibitionLayout(makeWorks(3))).toBeUndefined();
  });

  it('7 works → undefined (too many)', () => {
    expect(getExhibitionLayout(makeWorks(7))).toBeUndefined();
  });

  it('undefined → undefined', () => {
    expect(getExhibitionLayout(undefined)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// G. splitExhibitionDescription
// ---------------------------------------------------------------------------

describe('splitExhibitionDescription', () => {
  it('splits on double newline', () => {
    const result = splitExhibitionDescription('Thesis line.\n\nBody paragraph one.\n\nBody two.');
    expect(result.thesisLine).toBe('Thesis line.');
    expect(result.bodyParagraphs).toBe('Body paragraph one.\n\nBody two.');
  });

  it('single paragraph → thesis only, empty body', () => {
    const result = splitExhibitionDescription('Only one paragraph here.');
    expect(result.thesisLine).toBe('Only one paragraph here.');
    expect(result.bodyParagraphs).toBe('');
  });

  it('empty string → both empty', () => {
    const result = splitExhibitionDescription('');
    expect(result.thesisLine).toBe('');
    expect(result.bodyParagraphs).toBe('');
  });

  it('whitespace only → both empty', () => {
    const result = splitExhibitionDescription('   \n  ');
    expect(result.thesisLine).toBe('');
    expect(result.bodyParagraphs).toBe('');
  });

  it('trims surrounding whitespace', () => {
    const result = splitExhibitionDescription('  Thesis.  \n\n  Body.  ');
    expect(result.thesisLine).toBe('Thesis.');
    expect(result.bodyParagraphs).toBe('Body.');
  });

  it('does not mutate input', () => {
    const input = 'First.\n\nSecond.';
    splitExhibitionDescription(input);
    expect(input).toBe('First.\n\nSecond.');
  });
});

// ---------------------------------------------------------------------------
// H. No mutation
// ---------------------------------------------------------------------------

describe('No mutation', () => {
  it('getExperienceLayout does not mutate images array', () => {
    const images = makeImages(3);
    const snapshot = [...images];
    getExperienceLayout(images, 'workshop');
    expect(images).toEqual(snapshot);
  });

  it('getResultsLayout does not mutate images array', () => {
    const images = makeImages(2);
    const snapshot = [...images];
    getResultsLayout(images);
    expect(images).toEqual(snapshot);
  });

  it('getExhibitionLayout does not mutate works array', () => {
    const works = makeWorks(5);
    const snapshot = JSON.stringify(works);
    getExhibitionLayout(works);
    expect(JSON.stringify(works)).toBe(snapshot);
  });

  it('getPriceDisplay does not mutate price object', () => {
    const price: Money = { amount: 45, currency: 'EUR' };
    const snapshot = JSON.stringify(price);
    getPriceDisplay(price);
    expect(JSON.stringify(price)).toBe(snapshot);
  });
});
