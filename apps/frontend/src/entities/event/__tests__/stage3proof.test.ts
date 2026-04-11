// Exact proof tests for Stage 3, matching the user's specified inputs and outputs.

import { describe, expect, it } from 'vitest';

import type { Enrollment } from '../event.types';
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
import { createEventPage } from '../eventFactory';
import type { CaptionedWork, EventPageData } from '../eventPage.types';
import { buildEventRenderContext } from '../eventRenderContext';

// ---------------------------------------------------------------------------
// 1. buildEventRenderContext
// ---------------------------------------------------------------------------

describe('1. buildEventRenderContext', () => {
  it('mixed statuses → paidEnrollmentCount = 2', () => {
    const event = createEventPage('workshop');
    (event as unknown as Record<string, unknown>).enrollments = {
      a: { id: 'a', fullName: '', email: '', createdAt: '', paymentStatus: 'paid' } satisfies Enrollment,
      b: { id: 'b', fullName: '', email: '', createdAt: '', paymentStatus: 'pending' } satisfies Enrollment,
      c: { id: 'c', fullName: '', email: '', createdAt: '', paymentStatus: 'paid' } satisfies Enrollment,
    };
    const result = buildEventRenderContext(event);
    expect(result).toEqual({ paidEnrollmentCount: 2 });
  });

  it('missing enrollments → paidEnrollmentCount = 0', () => {
    const event = createEventPage('minimal');
    expect(event.enrollments).toBeUndefined();
    const result = buildEventRenderContext(event);
    expect(result).toEqual({ paidEnrollmentCount: 0 });
  });
});

// ---------------------------------------------------------------------------
// 2. getPriceDisplay
// ---------------------------------------------------------------------------

describe('2. getPriceDisplay', () => {
  it('undefined → "Free"', () => {
    expect(getPriceDisplay(undefined)).toBe('Free');
  });

  it('{ amount: 0, currency: "EUR" } → "Free"', () => {
    expect(getPriceDisplay({ amount: 0, currency: 'EUR' })).toBe('Free');
  });

  it('{ amount: 45, currency: "EUR" } → "€45"', () => {
    expect(getPriceDisplay({ amount: 45, currency: 'EUR' })).toBe('€45');
  });
});

// ---------------------------------------------------------------------------
// 3. getScarcityLabel
// ---------------------------------------------------------------------------

describe('3. getScarcityLabel', () => {
  it('undefined capacity → undefined', () => {
    expect(getScarcityLabel(undefined, 3)).toBeUndefined();
  });

  it('total 10, paid 0 → undefined', () => {
    expect(getScarcityLabel(10, 0)).toBeUndefined();
  });

  it('total 10, paid 7 → "3 of 10 spots remaining"', () => {
    expect(getScarcityLabel(10, 7)).toBe('3 of 10 spots remaining');
  });

  it('total 10, paid 10 → "Sold out"', () => {
    expect(getScarcityLabel(10, 10)).toBe('Sold out');
  });
});

// ---------------------------------------------------------------------------
// 4. getExperienceLayout
// ---------------------------------------------------------------------------

describe('4. getExperienceLayout', () => {
  it('workshop 1 image → exp-1', () => {
    expect(getExperienceLayout(['img1'], 'workshop')).toBe('exp-1');
  });

  it('workshop 2 images → exp-2', () => {
    expect(getExperienceLayout(['img1', 'img2'], 'workshop')).toBe('exp-2');
  });

  it('workshop 3 images → exp-3', () => {
    expect(getExperienceLayout(['img1', 'img2', 'img3'], 'workshop')).toBe('exp-3');
  });

  it('workshop 4 images → exp-4', () => {
    expect(getExperienceLayout(['img1', 'img2', 'img3', 'img4'], 'workshop')).toBe('exp-4');
  });

  it('pleinAir 3 images → exp-pleinair', () => {
    expect(getExperienceLayout(['img1', 'img2', 'img3'], 'pleinAir')).toBe('exp-pleinair');
  });

  it('pleinAir 4 images → exp-pleinair', () => {
    expect(getExperienceLayout(['img1', 'img2', 'img3', 'img4'], 'pleinAir')).toBe('exp-pleinair');
  });

  it('pleinAir 2 images → undefined', () => {
    expect(getExperienceLayout(['img1', 'img2'], 'pleinAir')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 5. getResultsLayout
// ---------------------------------------------------------------------------

describe('5. getResultsLayout', () => {
  it('2 images → res-2', () => {
    expect(getResultsLayout(['img1', 'img2'])).toBe('res-2');
  });

  it('3 images → res-3', () => {
    expect(getResultsLayout(['img1', 'img2', 'img3'])).toBe('res-3');
  });

  it('1 image → undefined', () => {
    expect(getResultsLayout(['img1'])).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 6. getExhibitionLayout
// ---------------------------------------------------------------------------

describe('6. getExhibitionLayout', () => {
  const w = (n: number): CaptionedWork[] =>
    Array.from({ length: n }, (_, i) => ({ image: `w${i}`, title: { en: `W${i}` } }));

  it('4 works → exhibition', () => {
    expect(getExhibitionLayout(w(4))).toBe('exhibition');
  });

  it('3 works → undefined', () => {
    expect(getExhibitionLayout(w(3))).toBeUndefined();
  });

  it('7 works → undefined', () => {
    expect(getExhibitionLayout(w(7))).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 7. Workshop CTA meta line
// ---------------------------------------------------------------------------

describe('7. getWorkshopCtaMetaLine', () => {
  it('full meta line', () => {
    const result = getWorkshopCtaMetaLine(
      '2026-05-17',
      { en: '3 hours' },
      { amount: 45, currency: 'EUR' },
    );
    expect(result).toBe('May 17, 2026 · 3 hours · €45 per person');
  });

  it('missing duration → date and price only', () => {
    const result = getWorkshopCtaMetaLine(
      '2026-05-17',
      undefined,
      { amount: 45, currency: 'EUR' },
    );
    expect(result).toBe('May 17, 2026 · €45 per person');
  });
});

// ---------------------------------------------------------------------------
// 8. Plein Air CTA meta line
// ---------------------------------------------------------------------------

describe('8. getPleinAirCtaMetaLine', () => {
  it('same-month date range', () => {
    const result = getPleinAirCtaMetaLine(
      '2026-06-14',
      '2026-06-15',
      { en: 'Camogli, Liguria' },
      { amount: 120, currency: 'EUR' },
    );
    expect(result).toBe('June 14–15, 2026 · Camogli, Liguria · €120 per person');
  });

  it('cross-month date range', () => {
    const result = getPleinAirCtaMetaLine(
      '2026-06-30',
      '2026-07-02',
      { en: 'Rome' },
      { amount: 120, currency: 'EUR' },
    );
    expect(result).toBe('June 30 – July 2, 2026 · Rome · €120 per person');
  });
});

// ---------------------------------------------------------------------------
// 9. splitExhibitionDescription
// ---------------------------------------------------------------------------

describe('9. splitExhibitionDescription', () => {
  it('single paragraph', () => {
    expect(splitExhibitionDescription('Thesis line.')).toEqual({
      thesisLine: 'Thesis line.',
      bodyParagraphs: '',
    });
  });

  it('multiple paragraphs', () => {
    expect(
      splitExhibitionDescription('Thesis line.\n\nBody paragraph one.\n\nBody two.'),
    ).toEqual({
      thesisLine: 'Thesis line.',
      bodyParagraphs: 'Body paragraph one.\n\nBody two.',
    });
  });

  it('empty string', () => {
    expect(splitExhibitionDescription('')).toEqual({
      thesisLine: '',
      bodyParagraphs: '',
    });
  });
});

// ---------------------------------------------------------------------------
// 10. No mutation
// ---------------------------------------------------------------------------

describe('10. No mutation', () => {
  it('getExperienceLayout does not mutate input array', () => {
    const images = ['a', 'b', 'c'];
    const snapshot = [...images];
    getExperienceLayout(images, 'workshop');
    expect(images).toEqual(snapshot);
  });

  it('splitExhibitionDescription does not mutate input string', () => {
    const input = 'First.\n\nSecond.';
    splitExhibitionDescription(input);
    expect(input).toBe('First.\n\nSecond.');
  });

  it('buildEventRenderContext does not mutate input event', () => {
    const event = createEventPage('workshop');
    const snapshot = JSON.stringify(event);
    buildEventRenderContext(event);
    expect(JSON.stringify(event)).toBe(snapshot);
  });
});
