import { describe, expect, it } from 'vitest';

import { CREATION_DEFAULTS } from '../eventDefaults';
import { createEventPage } from '../eventFactory';
import { EVENT_PRESETS } from '../eventPage.types';

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

// ---------------------------------------------------------------------------
// A. Preset creation
// ---------------------------------------------------------------------------

describe('Preset creation', () => {
  it.each(EVENT_PRESETS)('createEventPage("%s") returns correct preset', (preset) => {
    const event = createEventPage(preset);
    expect(event.preset).toBe(preset);
  });

  it('creates a minimal event', () => {
    const event = createEventPage('minimal');
    expect(event.preset).toBe('minimal');
  });

  it('creates a workshop event', () => {
    const event = createEventPage('workshop');
    expect(event.preset).toBe('workshop');
  });
});

// ---------------------------------------------------------------------------
// B. Draft status
// ---------------------------------------------------------------------------

describe('Draft status', () => {
  it.each(EVENT_PRESETS)('"%s" is created with status "draft"', (preset) => {
    const event = createEventPage(preset);
    expect(event.status).toBe('draft');
  });
});

// ---------------------------------------------------------------------------
// C. Creation defaults are materialized
// ---------------------------------------------------------------------------

describe('Creation defaults (Category A)', () => {
  it.each(EVENT_PRESETS)('"%s" has ctaLabel materialized', (preset) => {
    const event = createEventPage(preset);
    expect(event.ctaLabel).toBeDefined();
    expect(event.ctaLabel).toEqual(CREATION_DEFAULTS[preset].ctaLabel);
  });

  it('workshop has ctaBridge materialized', () => {
    const event = createEventPage('workshop');
    expect(event.preset).toBe('workshop');
    if (event.preset === 'workshop') {
      expect(event.ctaBridge).toBeDefined();
      expect(event.ctaBridge).toEqual(CREATION_DEFAULTS.workshop.ctaBridge);
    }
  });

  it('pleinAir has ctaBridge materialized', () => {
    const event = createEventPage('pleinAir');
    expect(event.preset).toBe('pleinAir');
    if (event.preset === 'pleinAir') {
      expect(event.ctaBridge).toBeDefined();
      expect(event.ctaBridge).toEqual(CREATION_DEFAULTS.pleinAir.ctaBridge);
    }
  });

  it('exhibition does NOT have ctaBridge', () => {
    const event = createEventPage('exhibition');
    expect('ctaBridge' in event).toBe(false);
  });

  it('minimal does NOT have ctaBridge', () => {
    const event = createEventPage('minimal');
    expect('ctaBridge' in event).toBe(false);
  });

  it('no render-only defaults are materialized (Category B fields)', () => {
    const renderOnlyFields = [
      'experienceTitle',
      'resultsTitle',
      'featuredWorksTitle',
      'descriptionLabel',
      'hostNoteLabel',
      'eyebrow',
      'secondaryAction',
    ];

    for (const preset of EVENT_PRESETS) {
      const event = createEventPage(preset) as unknown as Record<string, unknown>;
      for (const field of renderOnlyFields) {
        expect(event[field]).toBeUndefined();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// D. No derived fields
// ---------------------------------------------------------------------------

describe('No derived fields', () => {
  it.each(EVENT_PRESETS)('"%s" does not contain derived fields', (preset) => {
    const event = createEventPage(preset) as unknown as Record<string, unknown>;
    for (const field of DERIVED_FIELD_NAMES) {
      expect(event[field]).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// E. Optional fields stay absent
// ---------------------------------------------------------------------------

describe('Optional fields are absent', () => {
  it('workshop: optional fields are not present', () => {
    const event = createEventPage('workshop') as unknown as Record<string, unknown>;
    const optionalFields = [
      'hostNote',
      'hostName',
      'mapUrl',
      'cancellationNote',
      'experienceImages',
      'resultsImages',
      'capacity',
      'enrollments',
      'heroImage',
      'dateStart',
      'duration',
      'price',
    ];
    for (const field of optionalFields) {
      expect(event[field]).toBeUndefined();
    }
  });

  it('pleinAir: optional fields are not present', () => {
    const event = createEventPage('pleinAir') as unknown as Record<string, unknown>;
    const optionalFields = [
      'hostNote',
      'hostName',
      'mapUrl',
      'cancellationNote',
      'resultsImages',
      'experienceImages',
      'eyebrow',
      'dateEnd',
      'enrollments',
      'heroImage',
      'bridgeLine',
      'dateStart',
      'sessions',
      'meetingPoint',
      'groupSize',
      'price',
    ];
    for (const field of optionalFields) {
      expect(event[field]).toBeUndefined();
    }
  });

  it('exhibition: optional fields are not present', () => {
    const event = createEventPage('exhibition') as unknown as Record<string, unknown>;
    const optionalFields = [
      'hostNote',
      'hostName',
      'openingDate',
      'openingTime',
      'secondaryAction',
      'featuredWorks',
      'enrollments',
      'heroImage',
      'eyebrow',
      'descriptionLabel',
      'featuredWorksTitle',
      'hostNoteLabel',
      'dateStart',
      'dateEnd',
      'hours',
      'admission',
    ];
    for (const field of optionalFields) {
      expect(event[field]).toBeUndefined();
    }
  });

  it('minimal: optional fields are not present', () => {
    const event = createEventPage('minimal') as unknown as Record<string, unknown>;
    const optionalFields = [
      'heroImage',
      'eyebrow',
      'dateEnd',
      'time',
      'mapUrl',
      'price',
      'extendedDescription',
      'enrollments',
      'dateStart',
    ];
    for (const field of optionalFields) {
      expect(event[field]).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// F. Required localized content fields are initialized
// ---------------------------------------------------------------------------

describe('Required localized fields initialized as empty objects', () => {
  it('workshop: title, subtitle, description, location initialized', () => {
    const event = createEventPage('workshop');
    if (event.preset !== 'workshop') throw new Error('wrong preset');
    expect(event.title).toEqual({});
    expect(event.subtitle).toEqual({});
    expect(event.description).toEqual({});
    expect(event.location).toEqual({});
  });

  it('pleinAir: title, subtitle, description, location initialized', () => {
    const event = createEventPage('pleinAir');
    if (event.preset !== 'pleinAir') throw new Error('wrong preset');
    expect(event.title).toEqual({});
    expect(event.subtitle).toEqual({});
    expect(event.description).toEqual({});
    expect(event.location).toEqual({});
  });

  it('exhibition: title, description, location initialized', () => {
    const event = createEventPage('exhibition');
    if (event.preset !== 'exhibition') throw new Error('wrong preset');
    expect(event.title).toEqual({});
    expect(event.description).toEqual({});
    expect(event.location).toEqual({});
  });

  it('minimal: title, description, location initialized', () => {
    const event = createEventPage('minimal');
    if (event.preset !== 'minimal') throw new Error('wrong preset');
    expect(event.title).toEqual({});
    expect(event.description).toEqual({});
    expect(event.location).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Additional: id and slug
// ---------------------------------------------------------------------------

describe('ID and slug', () => {
  it.each(EVENT_PRESETS)('"%s" has id and slug as strings', (preset) => {
    const event = createEventPage(preset);
    expect(typeof event.id).toBe('string');
    expect(event.id.length).toBeGreaterThan(0);
    expect(typeof event.slug).toBe('string');
    expect(event.slug.length).toBeGreaterThan(0);
  });

  it('id starts with "event-"', () => {
    const event = createEventPage('workshop');
    expect(event.id).toMatch(/^event-/);
  });

  it('each call generates a unique id', () => {
    const a = createEventPage('minimal');
    const b = createEventPage('minimal');
    expect(a.id).not.toBe(b.id);
  });
});

// ---------------------------------------------------------------------------
// Additional: structural completeness
// ---------------------------------------------------------------------------

describe('Structural completeness', () => {
  it('factory covers all presets', () => {
    for (const preset of EVENT_PRESETS) {
      expect(() => createEventPage(preset)).not.toThrow();
    }
  });

  it('ctaLabel values are shallow copies, not shared references', () => {
    const a = createEventPage('workshop');
    const b = createEventPage('workshop');
    expect(a.ctaLabel).toEqual(b.ctaLabel);
    expect(a.ctaLabel).not.toBe(b.ctaLabel);
  });
});
