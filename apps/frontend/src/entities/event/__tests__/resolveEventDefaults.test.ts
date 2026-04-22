import { describe, expect, it } from 'vitest';

import { RENDER_DEFAULTS } from '../eventDefaults';
import { createEventPage } from '../eventFactory';
import { EVENT_PRESETS } from '../eventPage.types';
import type { PleinAirEventPage } from '../eventPage.types';
import { resolveEventDefaults } from '../resolveEventDefaults';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DERIVED_FIELD_NAMES = [
  'priceDisplay',
  'ctaMetaLine',
  'scarcityLabel',
  'stickyCtaLine',
  'experienceLayout',
  'resultsLayout',
  'exhibitionLayout',
  'thesisLine',
  'bodyParagraphs',
];

function asRecord(obj: object): Record<string, unknown> {
  return obj as unknown as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// A. Default is applied when field is missing
// ---------------------------------------------------------------------------

describe('Default applied when field missing', () => {
  it('pleinAir: eyebrow defaults to "Plein Air Session"', () => {
    const event = createEventPage('pleinAir');
    const resolved = resolveEventDefaults(event);
    if (resolved.preset !== 'pleinAir') throw new Error('wrong preset');
    expect(resolved.eyebrow).toEqual({ en: 'Plein Air Session' });
  });

  it('workshop: experienceTitle defaults to "The Workshop Experience"', () => {
    const event = createEventPage('workshop');
    const resolved = resolveEventDefaults(event);
    if (resolved.preset !== 'workshop') throw new Error('wrong preset');
    expect(resolved.experienceTitle).toEqual({ en: 'The Workshop Experience' });
  });

  it('workshop: resultsTitle defaults to "Participant Results"', () => {
    const event = createEventPage('workshop');
    const resolved = resolveEventDefaults(event);
    if (resolved.preset !== 'workshop') throw new Error('wrong preset');
    expect(resolved.resultsTitle).toEqual({ en: 'Participant Results' });
  });

  it('workshop: hostNoteLabel defaults to "A note from the host"', () => {
    const event = createEventPage('workshop');
    const resolved = resolveEventDefaults(event);
    if (resolved.preset !== 'workshop') throw new Error('wrong preset');
    expect(resolved.hostNoteLabel).toEqual({ en: 'A note from the host' });
  });

  it('exhibition: all 5 Category B fields are resolved', () => {
    const event = createEventPage('exhibition');
    const resolved = resolveEventDefaults(event);
    if (resolved.preset !== 'exhibition') throw new Error('wrong preset');
    expect(resolved.eyebrow).toEqual({ en: 'Exhibition' });
    expect(resolved.descriptionLabel).toEqual({ en: 'About the Exhibition' });
    expect(resolved.featuredWorksTitle).toEqual({ en: 'Selected Works' });
    expect(resolved.hostNoteLabel).toEqual({ en: 'From the artist' });
    expect(resolved.secondaryAction).toEqual({ en: 'Add to calendar' });
  });
});

// ---------------------------------------------------------------------------
// B. Stored value is NOT overridden
// ---------------------------------------------------------------------------

describe('Stored value preserved', () => {
  it('pleinAir: custom eyebrow is kept', () => {
    const event = createEventPage('pleinAir') as PleinAirEventPage;
    event.eyebrow = { en: 'Custom label' };
    const resolved = resolveEventDefaults(event);
    if (resolved.preset !== 'pleinAir') throw new Error('wrong preset');
    expect(resolved.eyebrow).toEqual({ en: 'Custom label' });
  });

  it('workshop: custom experienceTitle is kept', () => {
    const event = createEventPage('workshop');
    if (event.preset !== 'workshop') throw new Error('wrong preset');
    (event as unknown as Record<string, unknown>).experienceTitle = { en: 'My Gallery' };
    const resolved = resolveEventDefaults(event);
    if (resolved.preset !== 'workshop') throw new Error('wrong preset');
    expect(resolved.experienceTitle).toEqual({ en: 'My Gallery' });
  });

  it('exhibition: custom hostNoteLabel is kept', () => {
    const event = createEventPage('exhibition');
    if (event.preset !== 'exhibition') throw new Error('wrong preset');
    (event as unknown as Record<string, unknown>).hostNoteLabel = { en: 'Curator says' };
    const resolved = resolveEventDefaults(event);
    if (resolved.preset !== 'exhibition') throw new Error('wrong preset');
    expect(resolved.hostNoteLabel).toEqual({ en: 'Curator says' });
  });
});

// ---------------------------------------------------------------------------
// C. Works across all presets
// ---------------------------------------------------------------------------

describe('Works across all presets', () => {
  it.each(EVENT_PRESETS)('resolveEventDefaults works for "%s"', (preset) => {
    const event = createEventPage(preset);
    const resolved = resolveEventDefaults(event);
    expect(resolved.preset).toBe(preset);

    // All defaults for this preset should be present
    const defaults = RENDER_DEFAULTS[preset];
    for (const [key, expectedValue] of Object.entries(defaults)) {
      expect(asRecord(resolved)[key]).toEqual(expectedValue);
    }
  });
});

// ---------------------------------------------------------------------------
// D. Does not add fields not defined for preset
// ---------------------------------------------------------------------------

describe('No foreign fields added', () => {
  it('minimal does NOT receive experienceTitle', () => {
    const event = createEventPage('minimal');
    const resolved = resolveEventDefaults(event);
    expect(asRecord(resolved).experienceTitle).toBeUndefined();
  });

  it('minimal does NOT receive eyebrow from another preset', () => {
    const event = createEventPage('minimal');
    const resolved = resolveEventDefaults(event);
    // Minimal has eyebrow in its type but no render default for it
    expect(asRecord(resolved).eyebrow).toBeUndefined();
  });

  it('minimal does NOT receive hostNoteLabel', () => {
    const event = createEventPage('minimal');
    const resolved = resolveEventDefaults(event);
    expect(asRecord(resolved).hostNoteLabel).toBeUndefined();
  });

  it('minimal does NOT receive descriptionLabel', () => {
    const event = createEventPage('minimal');
    const resolved = resolveEventDefaults(event);
    expect(asRecord(resolved).descriptionLabel).toBeUndefined();
  });

  it('workshop does NOT receive secondaryAction', () => {
    const event = createEventPage('workshop');
    const resolved = resolveEventDefaults(event);
    expect(asRecord(resolved).secondaryAction).toBeUndefined();
  });

  it('workshop does NOT receive descriptionLabel', () => {
    const event = createEventPage('workshop');
    const resolved = resolveEventDefaults(event);
    expect(asRecord(resolved).descriptionLabel).toBeUndefined();
  });

  it('pleinAir does NOT receive featuredWorksTitle', () => {
    const event = createEventPage('pleinAir');
    const resolved = resolveEventDefaults(event);
    expect(asRecord(resolved).featuredWorksTitle).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// E. Does not include derived fields
// ---------------------------------------------------------------------------

describe('No derived fields in output', () => {
  it.each(EVENT_PRESETS)('"%s" output has no derived fields', (preset) => {
    const event = createEventPage(preset);
    const resolved = resolveEventDefaults(event);
    for (const field of DERIVED_FIELD_NAMES) {
      expect(asRecord(resolved)[field]).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// F. Does not mutate input
// ---------------------------------------------------------------------------

describe('Non-mutation', () => {
  it('input object is not mutated', () => {
    const event = createEventPage('pleinAir');
    const snapshot = JSON.stringify(event);
    resolveEventDefaults(event);
    expect(JSON.stringify(event)).toBe(snapshot);
  });

  it('resolved object is a different reference', () => {
    const event = createEventPage('workshop');
    const resolved = resolveEventDefaults(event);
    expect(resolved).not.toBe(event);
  });

  it('original event still has undefined Category B fields after resolution', () => {
    const event = createEventPage('pleinAir') as PleinAirEventPage;
    resolveEventDefaults(event);
    expect(event.eyebrow).toBeUndefined();
    expect((event as unknown as Record<string, unknown>).experienceTitle).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Additional: RENDER_DEFAULTS and CREATION_DEFAULTS have no overlap
// ---------------------------------------------------------------------------

describe('No overlap between creation and render defaults', () => {
  it('no field appears in both CREATION_DEFAULTS and RENDER_DEFAULTS', async () => {
    const { CREATION_DEFAULTS } = await import('../eventDefaults');

    for (const preset of EVENT_PRESETS) {
      const creationKeys = Object.keys(CREATION_DEFAULTS[preset]);
      const renderKeys = Object.keys(RENDER_DEFAULTS[preset]);
      const overlap = creationKeys.filter((k) => renderKeys.includes(k));
      expect(overlap).toEqual([]);
    }
  });
});
