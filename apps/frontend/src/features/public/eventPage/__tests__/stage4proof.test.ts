import { describe, expect, it, vi } from 'vitest';

import { createEventPage } from '@/entities/event/eventFactory';
import { resolveEventDefaults } from '@/entities/event/resolveEventDefaults';
import type {
  ExhibitionEventPage,
  MinimalEventPage,
  ResolvedEventPageData,
  WorkshopEventPage,
} from '@/entities/event/eventPage.types';
import type { EventRenderContext } from '@/entities/event/eventRenderContext';

import {
  assembleEventSections,
  getRenderedSections,
} from '../assembleEventSections';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const emptyCtx: EventRenderContext = { paidEnrollmentCount: 0 };

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
  // hostNote: absent
  // experienceImages: absent
  // resultsImages: absent
  return resolveEventDefaults(raw);
}

// ---------------------------------------------------------------------------
// 1. Sparse workshop — correct sections rendered in order
// ---------------------------------------------------------------------------

describe('1. Sparse workshop rendered sections', () => {
  it('renders exactly heroStandard, quickFacts, description, ctaBlock in that order', () => {
    const outputs = assembleEventSections(sparseWorkshop(), emptyCtx);
    const rendered = getRenderedSections(outputs);
    const kinds = rendered.map((o) => o.kind);

    console.log('sparse workshop rendered:', JSON.stringify(kinds));

    expect(kinds).toEqual(['heroStandard', 'quickFacts', 'description', 'ctaBlock']);
  });
});

// ---------------------------------------------------------------------------
// 2. Minimal override — heroCard renders, description skipped
// ---------------------------------------------------------------------------

describe('2. Minimal sourceFieldOverride', () => {
  it('heroCard renders, description section is skipped when extendedDescription absent', () => {
    const raw = createEventPage('minimal') as MinimalEventPage;
    raw.title = { en: 'Open Studio Night' };
    raw.description = { en: 'Drawing, music, conversation.' };
    raw.dateStart = '2026-04-25';
    raw.location = { en: 'Studio 12' };
    raw.ctaLabel = { en: 'RSVP' };
    // extendedDescription: NOT set
    const event = resolveEventDefaults(raw);

    const outputs = assembleEventSections(event, emptyCtx);
    const rendered = getRenderedSections(outputs);
    const kinds = rendered.map((o) => o.kind);

    console.log('minimal without extendedDescription rendered:', JSON.stringify(kinds));
    console.log('minimal full outputs:', JSON.stringify(outputs, null, 2));

    expect(kinds).toContain('heroCard');
    expect(kinds).not.toContain('description');
    expect(kinds).toEqual(['heroCard']);
  });
});

// ---------------------------------------------------------------------------
// 3. Broken workshop — development mode
// ---------------------------------------------------------------------------

describe('3. Development mode — missing required title (other fields present)', () => {
  // Author-preview parity: production / development / editorPreview all
  // render a required section as long as ANY of its source fields has
  // content. Empty title → mapper produces empty string; section
  // structure stays visible to match the editor preview.
  it('renders heroStandard with partial data when other required fields are populated', () => {
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).title = {};

    const outputs = assembleEventSections(event, emptyCtx, { mode: 'development' });
    const hero = outputs.find((o) => o.kind === 'heroStandard');

    expect(hero).toBeDefined();
    expect(hero!.status).toBe('rendered');
    expect(hero!.importance).toBe('required');
  });

  it('emits error-placeholder when EVERY required source field is empty', () => {
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
// 4. Broken workshop — production mode
// ---------------------------------------------------------------------------

describe('4. Production mode — missing required title (other fields present)', () => {
  // Previously the strict allPresent rule dropped heroStandard whenever
  // ANY required field was empty, so the public page diverged from
  // editor preview (workshop showed bare title + galleries while preview
  // showed a full hero). After the parity fix, production renders the
  // section when at least one required field has content; the mapper
  // produces empty strings for missing ones so the layout matches.
  it('renders heroStandard so the public page matches editor preview', () => {
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).title = {};

    const outputs = assembleEventSections(event, emptyCtx, { mode: 'production' });
    const rendered = getRenderedSections(outputs);
    const kinds = rendered.map((o) => o.kind);

    expect(kinds).toContain('heroStandard');
  });

  it('drops heroStandard silently when EVERY required source field is empty', () => {
    const event = fullWorkshop();
    const r = event as unknown as Record<string, unknown>;
    r.title = {};
    r.subtitle = {};
    r.heroImage = undefined;
    r.price = undefined;
    r.dateStart = undefined;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let outputs: ReturnType<typeof assembleEventSections> | undefined;
    expect(() => {
      outputs = assembleEventSections(event, emptyCtx, { mode: 'production' });
    }).not.toThrow();

    const rendered = getRenderedSections(outputs!);
    const kinds = rendered.map((o) => o.kind);

    expect(kinds).not.toContain('heroStandard');
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// 5. Broken workshop — editorPreview mode
// ---------------------------------------------------------------------------

describe('5. EditorPreview mode — missing required title', () => {
  it('renders heroStandard with partial data in editorPreview', () => {
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).title = {};

    const outputs = assembleEventSections(event, emptyCtx, { mode: 'editorPreview' });
    const hero = outputs.find((o) => o.kind === 'heroStandard');

    expect(hero).toBeDefined();
    // editorPreview renders required sections with partial data for live feedback
    expect(hero!.status).toBe('rendered');
    expect(hero!.importance).toBe('required');
  });
});

// ---------------------------------------------------------------------------
// 6. Exact debug outputs for all four fixtures
// ---------------------------------------------------------------------------

describe('6. Exact debug outputs', () => {
  it('full workshop', () => {
    const outputs = assembleEventSections(fullWorkshop(), emptyCtx);
    console.log('FULL WORKSHOP:\n' + JSON.stringify(outputs, null, 2));
    expect(outputs).toHaveLength(7);
  });

  it('sparse workshop', () => {
    const outputs = assembleEventSections(sparseWorkshop(), emptyCtx);
    console.log('SPARSE WORKSHOP:\n' + JSON.stringify(outputs, null, 2));
    expect(outputs).toHaveLength(7); // 4 rendered + 3 skipped
  });

  it('minimal with extendedDescription', () => {
    const raw = createEventPage('minimal') as MinimalEventPage;
    raw.title = { en: 'Open Studio Night' };
    raw.description = { en: 'Drawing, music, conversation.' };
    raw.dateStart = '2026-04-25';
    raw.location = { en: 'Studio 12' };
    raw.ctaLabel = { en: 'RSVP' };
    (raw as unknown as Record<string, unknown>).extendedDescription = {
      en: 'Easels and paper provided.',
    };
    const event = resolveEventDefaults(raw);
    const outputs = assembleEventSections(event, emptyCtx);
    console.log('MINIMAL WITH EXT:\n' + JSON.stringify(outputs, null, 2));
    expect(outputs).toHaveLength(2);
  });

  it('minimal without extendedDescription', () => {
    const raw = createEventPage('minimal') as MinimalEventPage;
    raw.title = { en: 'Open Studio Night' };
    raw.description = { en: 'Drawing, music, conversation.' };
    raw.dateStart = '2026-04-25';
    raw.location = { en: 'Studio 12' };
    raw.ctaLabel = { en: 'RSVP' };
    const event = resolveEventDefaults(raw);
    const outputs = assembleEventSections(event, emptyCtx);
    console.log('MINIMAL WITHOUT EXT:\n' + JSON.stringify(outputs, null, 2));
    expect(outputs).toHaveLength(2); // 1 rendered + 1 skipped
  });
});

// ---------------------------------------------------------------------------
// 7. QuickFacts proof
// ---------------------------------------------------------------------------

describe('7. QuickFacts preset proof', () => {
  it('workshop renders quickFacts', () => {
    const outputs = assembleEventSections(fullWorkshop(), emptyCtx);
    const qf = outputs.find((o) => o.kind === 'quickFacts');
    expect(qf).toBeDefined();
    expect(qf!.status).toBe('rendered');
  });

  it('pleinAir renders quickFacts when all fields present', () => {
    const raw = createEventPage('pleinAir');
    if (raw.preset !== 'pleinAir') throw new Error('wrong');
    raw.title = { en: 'Painting the Coast' };
    raw.subtitle = { en: 'Two days' };
    raw.heroImage = 'hero-1';
    raw.description = { en: 'An invitation.' };
    raw.experienceImages = ['a', 'b', 'c'];
    raw.dateStart = '2026-06-14';
    raw.sessions = { en: '2 mornings' };
    raw.meetingPoint = { en: 'Camogli harbour' };
    raw.location = { en: 'Liguria' };
    raw.groupSize = 6;
    raw.price = { amount: 120, currency: 'EUR' };
    raw.ctaBridge = { en: 'Two mornings.' };
    raw.ctaLabel = { en: 'Join' };
    const event = resolveEventDefaults(raw);
    const outputs = assembleEventSections(event, emptyCtx);
    const qf = outputs.find((o) => o.kind === 'quickFacts');
    expect(qf).toBeDefined();
    expect(qf!.status).toBe('rendered');
  });

  it('minimal does not include quickFacts', () => {
    const raw = createEventPage('minimal') as MinimalEventPage;
    raw.title = { en: 'Test' };
    raw.description = { en: 'Test' };
    raw.dateStart = '2026-04-25';
    raw.location = { en: 'Milan' };
    raw.ctaLabel = { en: 'RSVP' };
    const outputs = assembleEventSections(resolveEventDefaults(raw), emptyCtx);
    const kinds = outputs.map((o) => o.kind);
    expect(kinds).not.toContain('quickFacts');
  });

  it('exhibition does not include quickFacts', () => {
    const raw = createEventPage('exhibition') as ExhibitionEventPage;
    raw.title = { en: 'Test' };
    raw.heroImage = 'img';
    raw.dateStart = '2026-04-18';
    raw.dateEnd = '2026-05-12';
    raw.description = { en: 'Text' };
    raw.featuredWorks = [
      { image: 'w1', title: { en: 'W1' } },
      { image: 'w2', title: { en: 'W2' } },
      { image: 'w3', title: { en: 'W3' } },
      { image: 'w4', title: { en: 'W4' } },
    ];
    raw.hours = { en: 'Tue-Sat' };
    raw.location = { en: 'Milan' };
    raw.admission = { en: 'Free' };
    raw.ctaLabel = { en: 'RSVP' };
    const outputs = assembleEventSections(resolveEventDefaults(raw), emptyCtx);
    const kinds = outputs.map((o) => o.kind);
    expect(kinds).not.toContain('quickFacts');
  });
});
