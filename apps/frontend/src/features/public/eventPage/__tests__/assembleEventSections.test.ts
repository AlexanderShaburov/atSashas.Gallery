import { describe, expect, it, vi } from 'vitest';

import { createEventPage } from '@/entities/event/eventFactory';
import { resolveEventDefaults } from '@/entities/event/resolveEventDefaults';
import type { ResolvedEventPageData } from '@/entities/event/eventPage.types';
import type { EventRenderContext } from '@/entities/event/eventRenderContext';
import type {
  WorkshopEventPage,
  ExhibitionEventPage,
  MinimalEventPage,
} from '@/entities/event/eventPage.types';

import {
  assembleEventSections,
  getRenderedSections,
} from '../assembleEventSections';
import type { SectionOutput } from '../assembleEventSections';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const emptyCtx: EventRenderContext = { paidEnrollmentCount: 0 };

function kinds(outputs: SectionOutput[]): string[] {
  return outputs.map((o) => o.kind);
}

function renderedKinds(outputs: SectionOutput[]): string[] {
  return getRenderedSections(outputs).map((o) => o.kind);
}

/** A fully filled workshop event page for testing. */
function fullWorkshop(): ResolvedEventPageData {
  const raw = createEventPage('workshop') as WorkshopEventPage;
  raw.title = { en: 'Watercolor Foundations' };
  raw.subtitle = { en: 'For beginners' };
  raw.heroImage = 'hero-img-1';
  raw.dateStart = '2026-05-17';
  raw.duration = { en: '3 hours' };
  raw.location = { en: 'Studio 12, Milan' };
  raw.price = { amount: 45, currency: 'EUR' };
  raw.description = { en: 'Learn watercolor fundamentals.' };
  raw.hostNote = { en: 'No experience needed.' };
  raw.hostName = 'Sasha';
  raw.experienceImages = ['img-1', 'img-2', 'img-3'];
  raw.resultsImages = ['res-1', 'res-2'];
  raw.ctaBridge = { en: 'You will leave with a finished piece.' };
  raw.ctaLabel = { en: 'Reserve Your Spot' };
  return resolveEventDefaults(raw);
}

/** Workshop with only required fields filled. */
function sparseWorkshop(): ResolvedEventPageData {
  const raw = createEventPage('workshop') as WorkshopEventPage;
  raw.title = { en: 'Watercolor Foundations' };
  raw.subtitle = { en: 'For beginners' };
  raw.heroImage = 'hero-img-1';
  raw.dateStart = '2026-05-17';
  raw.duration = { en: '3 hours' };
  raw.location = { en: 'Studio 12' };
  raw.price = { amount: 45, currency: 'EUR' };
  raw.description = { en: 'Learn watercolor.' };
  raw.ctaBridge = { en: 'Ready?' };
  raw.ctaLabel = { en: 'Reserve' };
  // hostNote, experienceImages, resultsImages → absent
  return resolveEventDefaults(raw);
}

function fullMinimalWithExtended(): ResolvedEventPageData {
  const raw = createEventPage('minimal') as MinimalEventPage;
  raw.title = { en: 'Open Studio Night' };
  raw.description = { en: 'Drawing, music, conversation.' };
  raw.dateStart = '2026-04-25';
  raw.location = { en: 'Studio 12' };
  raw.ctaLabel = { en: 'RSVP' };
  (raw as unknown as Record<string, unknown>).extendedDescription = {
    en: 'Easels and paper provided.',
  };
  return resolveEventDefaults(raw);
}

function minimalWithoutExtended(): ResolvedEventPageData {
  const raw = createEventPage('minimal') as MinimalEventPage;
  raw.title = { en: 'Open Studio Night' };
  raw.description = { en: 'Drawing, music, conversation.' };
  raw.dateStart = '2026-04-25';
  raw.location = { en: 'Studio 12' };
  raw.ctaLabel = { en: 'RSVP' };
  return resolveEventDefaults(raw);
}

function fullExhibition(): ResolvedEventPageData {
  const raw = createEventPage('exhibition') as ExhibitionEventPage;
  raw.title = { en: 'Between Memory and Place' };
  raw.heroImage = 'hero-art-1';
  raw.dateStart = '2026-04-18';
  raw.dateEnd = '2026-05-12';
  raw.description = { en: 'Twelve works.\n\nBody text.' };
  raw.featuredWorks = [
    { image: 'w1', title: { en: 'Work 1' } },
    { image: 'w2', title: { en: 'Work 2' } },
    { image: 'w3', title: { en: 'Work 3' } },
    { image: 'w4', title: { en: 'Work 4' } },
  ];
  raw.hours = { en: 'Tue–Sat, 11–18' };
  raw.location = { en: 'Galleria Sasha, Milan' };
  raw.admission = { en: 'Free' };
  raw.ctaLabel = { en: 'RSVP for Opening' };
  raw.hostNote = { en: 'Artist note here.' };
  return resolveEventDefaults(raw);
}

// ---------------------------------------------------------------------------
// A. Correct section order by preset
// ---------------------------------------------------------------------------

describe('A. Section order by preset', () => {
  it('workshop: full event renders all 7 sections in order', () => {
    const outputs = assembleEventSections(fullWorkshop(), emptyCtx);
    expect(renderedKinds(outputs)).toEqual([
      'heroStandard',
      'quickFacts',
      'description',
      'hostNote',
      'galleryExperience',
      'galleryResults',
      'ctaBlock',
    ]);
  });

  it('minimal with extendedDescription renders heroCard + description', () => {
    const outputs = assembleEventSections(fullMinimalWithExtended(), emptyCtx);
    expect(renderedKinds(outputs)).toEqual(['heroCard', 'description']);
  });

  it('minimal without extendedDescription renders only heroCard', () => {
    const outputs = assembleEventSections(minimalWithoutExtended(), emptyCtx);
    expect(renderedKinds(outputs)).toEqual(['heroCard']);
  });

  it('exhibition with hostNote renders all 5 sections in order', () => {
    const outputs = assembleEventSections(fullExhibition(), emptyCtx);
    expect(renderedKinds(outputs)).toEqual([
      'heroEditorial',
      'description',
      'featuredWorks',
      'hostNote',
      'visitCta',
    ]);
  });

  it('exhibition without hostNote renders 4 sections', () => {
    const event = fullExhibition();
    // Remove hostNote
    (event as unknown as Record<string, unknown>).hostNote = undefined;
    const outputs = assembleEventSections(event, emptyCtx);
    expect(renderedKinds(outputs)).toEqual([
      'heroEditorial',
      'description',
      'featuredWorks',
      'visitCta',
    ]);
  });
});

// ---------------------------------------------------------------------------
// B. Optional sections are skipped when data absent
// ---------------------------------------------------------------------------

describe('B. Optional sections skipped', () => {
  it('workshop without hostNote → no hostNote section', () => {
    const outputs = assembleEventSections(sparseWorkshop(), emptyCtx);
    const sectionKinds = renderedKinds(outputs);
    expect(sectionKinds).not.toContain('hostNote');
  });

  it('workshop without resultsImages → no galleryResults section', () => {
    const outputs = assembleEventSections(sparseWorkshop(), emptyCtx);
    expect(renderedKinds(outputs)).not.toContain('galleryResults');
  });

  it('workshop without experienceImages → no galleryExperience section', () => {
    const outputs = assembleEventSections(sparseWorkshop(), emptyCtx);
    expect(renderedKinds(outputs)).not.toContain('galleryExperience');
  });

  it('minimal without extendedDescription → no description section', () => {
    const outputs = assembleEventSections(minimalWithoutExtended(), emptyCtx);
    expect(renderedKinds(outputs)).not.toContain('description');
  });
});

// ---------------------------------------------------------------------------
// C. Required sections in development mode
// ---------------------------------------------------------------------------

describe('C. Required sections — development mode', () => {
  it('workshop missing one required field → renders heroStandard with partial data (parity)', () => {
    // After the author-preview parity fix, a required section renders as
    // long as at least one of its source fields is populated. The mapper
    // produces empty strings for missing fields so the layout matches
    // editor preview.
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).title = {};

    const outputs = assembleEventSections(event, emptyCtx, { mode: 'development' });
    const hero = outputs.find((o) => o.kind === 'heroStandard');

    expect(hero).toBeDefined();
    expect(hero!.status).toBe('rendered');
  });

  it('workshop with EVERY required field empty → error-placeholder + console.error', () => {
    const event = fullWorkshop();
    const r = event as unknown as Record<string, unknown>;
    r.title = {};
    r.subtitle = {};
    r.heroImage = undefined;
    r.price = undefined;
    r.dateStart = undefined;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const outputs = assembleEventSections(event, emptyCtx, { mode: 'development' });
    const hero = outputs.find((o) => o.kind === 'heroStandard');

    expect(hero).toBeDefined();
    expect(hero!.status).toBe('error-placeholder');
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// D. Required sections in production mode
// ---------------------------------------------------------------------------

describe('D. Required sections — production mode', () => {
  it('workshop missing one required field → renders heroStandard (parity with editor preview)', () => {
    // Old behavior dropped the section entirely, leaving the public
    // page bare. The parity fix renders the section when ANY required
    // field has content.
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).title = {};

    const outputs = assembleEventSections(event, emptyCtx, { mode: 'production' });
    const rendered = getRenderedSections(outputs);

    expect(rendered.find((o) => o.kind === 'heroStandard')).toBeDefined();
  });

  it('workshop with EVERY required field empty → heroStandard is silently dropped', () => {
    const event = fullWorkshop();
    const r = event as unknown as Record<string, unknown>;
    r.title = {};
    r.subtitle = {};
    r.heroImage = undefined;
    r.price = undefined;
    r.dateStart = undefined;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const outputs = assembleEventSections(event, emptyCtx, { mode: 'production' });
    const rendered = getRenderedSections(outputs);

    expect(rendered.find((o) => o.kind === 'heroStandard')).toBeUndefined();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('does not throw on missing required data', () => {
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).title = {};
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => assembleEventSections(event, emptyCtx, { mode: 'production' })).not.toThrow();

    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// E. Editor preview behavior
// ---------------------------------------------------------------------------

describe('E. Editor preview mode', () => {
  it('workshop missing title → rendered (partial data) for heroStandard in editorPreview', () => {
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).title = {};

    const outputs = assembleEventSections(event, emptyCtx, { mode: 'editorPreview' });
    const hero = outputs.find((o) => o.kind === 'heroStandard');

    expect(hero).toBeDefined();
    // editorPreview renders required sections with partial data for live feedback
    expect(hero!.status).toBe('rendered');
  });
});

// ---------------------------------------------------------------------------
// F. Fixed order preserved when sections are skipped
// ---------------------------------------------------------------------------

describe('F. Fixed order preserved', () => {
  it('sparse workshop: remaining sections in correct relative order', () => {
    const outputs = assembleEventSections(sparseWorkshop(), emptyCtx);
    const rendered = renderedKinds(outputs);

    // Must be: heroStandard, quickFacts, description, ctaBlock
    // (hostNote, galleryExperience, galleryResults skipped)
    expect(rendered).toEqual([
      'heroStandard',
      'quickFacts',
      'description',
      'ctaBlock',
    ]);
  });

  it('skipping middle sections does not change order of remaining', () => {
    // Full workshop has 7 sections. Remove hostNote and resultsImages.
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).hostNote = undefined;
    (event as unknown as Record<string, unknown>).resultsImages = undefined;
    const rendered = renderedKinds(assembleEventSections(event, emptyCtx));

    expect(rendered).toEqual([
      'heroStandard',
      'quickFacts',
      'description',
      'galleryExperience',
      'ctaBlock',
    ]);
  });
});

// ---------------------------------------------------------------------------
// G. Minimal source field override
// ---------------------------------------------------------------------------

describe('G. Minimal sourceFieldOverride', () => {
  it('heroCard reads description (card text), not extendedDescription', () => {
    const event = minimalWithoutExtended();
    // heroCard needs: title, description, dateStart, location, ctaLabel
    // All present. Should render.
    const outputs = assembleEventSections(event, emptyCtx);
    const heroCard = outputs.find((o) => o.kind === 'heroCard');
    expect(heroCard).toBeDefined();
    expect(heroCard!.status).toBe('rendered');
  });

  it('optional description section reads extendedDescription, not description', () => {
    // With extendedDescription → description section renders
    const withExt = fullMinimalWithExtended();
    const outputsWith = assembleEventSections(withExt, emptyCtx);
    expect(renderedKinds(outputsWith)).toContain('description');

    // Without extendedDescription → description section skipped
    const withoutExt = minimalWithoutExtended();
    const outputsWithout = assembleEventSections(withoutExt, emptyCtx);
    expect(renderedKinds(outputsWithout)).not.toContain('description');

    // But heroCard still renders in both cases (it reads description, not extendedDescription)
    expect(renderedKinds(outputsWith)).toContain('heroCard');
    expect(renderedKinds(outputsWithout)).toContain('heroCard');
  });
});

// ---------------------------------------------------------------------------
// H. QuickFacts mapping is preset-correct
// ---------------------------------------------------------------------------

describe('H. QuickFacts preset mapping', () => {
  it('workshop renders quickFacts with workshop fields', () => {
    const outputs = assembleEventSections(fullWorkshop(), emptyCtx);
    const qf = outputs.find((o) => o.kind === 'quickFacts');
    expect(qf).toBeDefined();
    expect(qf!.status).toBe('rendered');
  });

  it('workshop missing duration → quickFacts still renders with partial data (parity)', () => {
    // After the parity fix, a required section renders when ANY of its
    // source fields has content. quickFacts (workshop) requires
    // [dateStart, duration, location, price]; with duration empty but
    // others populated, the section is rendered and the missing item
    // is simply omitted from the rendered list.
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).duration = undefined;
    const outputs = assembleEventSections(event, emptyCtx, { mode: 'development' });
    const qf = outputs.find((o) => o.kind === 'quickFacts');
    expect(qf!.status).toBe('rendered');
  });

  it('exhibition does not render quickFacts', () => {
    const outputs = assembleEventSections(fullExhibition(), emptyCtx);
    expect(kinds(outputs)).not.toContain('quickFacts');
  });

  it('minimal does not render quickFacts', () => {
    const outputs = assembleEventSections(fullMinimalWithExtended(), emptyCtx);
    expect(kinds(outputs)).not.toContain('quickFacts');
  });
});

// ---------------------------------------------------------------------------
// Debug output examples
// ---------------------------------------------------------------------------

describe('Debug output snapshots', () => {
  it('full workshop → 7 rendered sections', () => {
    const outputs = assembleEventSections(fullWorkshop(), emptyCtx);
    expect(outputs.every((o) => o.status === 'rendered')).toBe(true);
    expect(outputs).toHaveLength(7);
  });

  it('sparse workshop → 4 rendered + 3 skipped', () => {
    const outputs = assembleEventSections(sparseWorkshop(), emptyCtx);
    const rendered = outputs.filter((o) => o.status === 'rendered');
    const skipped = outputs.filter((o) => o.status === 'skipped-optional');
    expect(rendered).toHaveLength(4);
    expect(skipped).toHaveLength(3);
  });

  it('minimal with extendedDescription → 2 rendered', () => {
    const outputs = assembleEventSections(fullMinimalWithExtended(), emptyCtx);
    const rendered = getRenderedSections(outputs);
    expect(rendered).toHaveLength(2);
  });

  it('minimal without extendedDescription → 1 rendered + 1 skipped', () => {
    const outputs = assembleEventSections(minimalWithoutExtended(), emptyCtx);
    const rendered = getRenderedSections(outputs);
    const skipped = outputs.filter((o) => o.status === 'skipped-optional');
    expect(rendered).toHaveLength(1);
    expect(skipped).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Regression: Pydantic-serialized null Localized must not count as present.
//
// Backend `Localized` defaults to {en:null, ru:null, it:null, es:null, pt:null}
// when the field is unset. The previous `hasField` implementation counted
// Object.keys length and treated this as populated, so sections rendered
// with empty text content while the production / public renderer dropped
// them based on its own (also-buggy) logic. See
// `bug--render--event-page-section-loss-on-deploy.md`.
// ---------------------------------------------------------------------------

describe('Regression — null-Localized is treated as missing', () => {
  // The fix here is that hasField recurses into the value: a Pydantic
  // round-trip Localized of {en:null, ru:null, …} is "missing" rather
  // than "present-with-five-keys". Combined with the parity fix
  // (production renders required sections when ANY source field is
  // populated), this surfaces as: that single field reads as empty in
  // the mapped output, while the section still renders if other fields
  // have content. Only when EVERY required field is empty is the
  // section dropped.
  function pydanticNullLocalized() {
    return { en: null, ru: null, it: null, es: null, pt: null };
  }

  it('all-null Localized title is treated as empty by hasField', () => {
    const event = fullWorkshop();
    const r = event as unknown as Record<string, unknown>;
    r.title = pydanticNullLocalized();
    // Other source fields are also empty, so heroStandard should be
    // dropped in production — proving null-Localized doesn't satisfy
    // hasField.
    r.subtitle = pydanticNullLocalized();
    r.heroImage = undefined;
    r.price = undefined;
    r.dateStart = undefined;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const outputs = assembleEventSections(event, emptyCtx, { mode: 'production' });
    spy.mockRestore();
    expect(getRenderedSections(outputs).map((o) => o.kind)).not.toContain('heroStandard');
  });

  it('partially populated Localized counts as present', () => {
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).title = {
      en: 'Watercolor Foundations',
      ru: null,
      it: null,
      es: null,
      pt: null,
    };
    const outputs = assembleEventSections(event, emptyCtx, { mode: 'production' });
    expect(getRenderedSections(outputs).map((o) => o.kind)).toContain('heroStandard');
  });

  it('empty string Localized counts as missing', () => {
    // With every required field empty, including title's {en:''}, the
    // section drops in production — confirming the empty-string leaf
    // is treated as no content.
    const event = fullWorkshop();
    const r = event as unknown as Record<string, unknown>;
    r.title = { en: '', ru: null };
    r.subtitle = pydanticNullLocalized();
    r.heroImage = undefined;
    r.price = undefined;
    r.dateStart = undefined;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const outputs = assembleEventSections(event, emptyCtx, { mode: 'production' });
    spy.mockRestore();
    expect(getRenderedSections(outputs).map((o) => o.kind)).not.toContain('heroStandard');
  });
});
