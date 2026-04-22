import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { createEventPage } from '@/entities/event/eventFactory';
import { resolveEventDefaults } from '@/entities/event/resolveEventDefaults';
import { buildEventRenderContext } from '@/entities/event/eventRenderContext';
import { mapEventToRenderModel } from '@/features/public/eventPage/mapEventToRenderModel';
import { EventPageView } from '@/features/public/eventPage/EventPageView';
import type {
  EventPageData,
  WorkshopEventPage,
  PleinAirEventPage,
  ExhibitionEventPage,
  MinimalEventPage,
} from '@/entities/event/eventPage.types';
import { EVENT_PRESETS } from '@/entities/event/eventPage.types';

// ---------------------------------------------------------------------------
// A. Draft creation — factory produces valid EventPageData
// ---------------------------------------------------------------------------

describe('A. Draft creation', () => {
  it.each(EVENT_PRESETS)('createEventPage("%s") produces EventPageData with preset field', (preset) => {
    const page = createEventPage(preset);
    expect(page.preset).toBe(preset);
    expect(page.id).toBeTruthy();
    expect(page.slug).toBeTruthy();
    expect(page.status).toBe('draft');
  });

  it('workshop draft has required workshop fields', () => {
    const page = createEventPage('workshop') as WorkshopEventPage;
    expect(page.ctaLabel).toBeDefined();
    expect(page.ctaBridge).toBeDefined();
    expect(page.title).toBeDefined();
    expect(page.description).toBeDefined();
    expect(page.location).toBeDefined();
  });

  it('exhibition draft does NOT have ctaBridge', () => {
    const page = createEventPage('exhibition');
    expect((page as unknown as Record<string, unknown>)['ctaBridge']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// B. Preset is assigned and immutable
// ---------------------------------------------------------------------------

describe('B. Preset immutability', () => {
  it.each(EVENT_PRESETS)('"%s" preset is a string literal, not modifiable by design', (preset) => {
    const page = createEventPage(preset);
    expect(page.preset).toBe(preset);
    // The EventPageData union discriminates on preset — changing it would
    // violate the type system. This test verifies the factory output is correct.
  });
});

// ---------------------------------------------------------------------------
// C. Editing fields updates draft state
// ---------------------------------------------------------------------------

describe('C. Draft field updates', () => {
  it('setting title produces valid Localized object', () => {
    const page = createEventPage('workshop') as WorkshopEventPage;
    const updated = { ...page, title: { en: 'New Title' } };
    expect(updated.title.en).toBe('New Title');
    expect(updated.preset).toBe('workshop');
  });

  it('setting dateStart adds string field', () => {
    const page = createEventPage('workshop');
    const updated = { ...page, dateStart: '2026-05-17' } as WorkshopEventPage;
    expect(updated.dateStart).toBe('2026-05-17');
  });

  it('setting price adds Money object', () => {
    const page = createEventPage('workshop');
    const updated = { ...page, price: { amount: 45, currency: 'EUR' as const } } as WorkshopEventPage;
    expect(updated.price!.amount).toBe(45);
  });

  it('updated draft preserves all original fields', () => {
    const page = createEventPage('workshop') as WorkshopEventPage;
    const updated = { ...page, title: { en: 'Changed' } };
    expect(updated.id).toBe(page.id);
    expect(updated.slug).toBe(page.slug);
    expect(updated.preset).toBe('workshop');
    expect(updated.ctaLabel).toEqual(page.ctaLabel);
  });
});

// ---------------------------------------------------------------------------
// D. Save persists changes (pure data test — no API)
// ---------------------------------------------------------------------------

describe('D. Draft round-trip serialization', () => {
  it('draft survives JSON serialization', () => {
    const page = createEventPage('workshop') as WorkshopEventPage;
    const filled = {
      ...page,
      title: { en: 'Test Workshop' },
      subtitle: { en: 'Learn to paint' },
      description: { en: 'A great workshop' },
      dateStart: '2026-05-17',
      location: { en: 'Studio 12' },
      price: { amount: 45, currency: 'EUR' as const },
    };
    const serialized = JSON.parse(JSON.stringify(filled));
    expect(serialized.title.en).toBe('Test Workshop');
    expect(serialized.subtitle.en).toBe('Learn to paint');
    expect(serialized.dateStart).toBe('2026-05-17');
    expect(serialized.price.amount).toBe(45);
    expect(serialized.preset).toBe('workshop');
  });

  it.each(EVENT_PRESETS)('"%s" draft survives serialize/deserialize', (preset) => {
    const page = createEventPage(preset);
    const roundTripped = JSON.parse(JSON.stringify(page));
    expect(roundTripped.preset).toBe(preset);
    expect(roundTripped.id).toBe(page.id);
    expect(roundTripped.status).toBe('draft');
  });
});

// ---------------------------------------------------------------------------
// E. Exit without save discards changes (pure data test)
// ---------------------------------------------------------------------------

describe('E. Discard behavior', () => {
  it('original snapshot is unchanged when draft is modified', () => {
    const original = createEventPage('workshop') as WorkshopEventPage;
    const snapshot = JSON.parse(JSON.stringify(original)); // simulate snapshot
    const draft = { ...original, title: { en: 'Modified' } };

    // Draft diverges
    expect(draft.title.en).toBe('Modified');
    // Snapshot unchanged
    expect(snapshot.title.en).toBeUndefined();
    // On exit, we'd restore from snapshot
    expect(snapshot.preset).toBe('workshop');
  });
});

// ---------------------------------------------------------------------------
// F. Preview renders using updated draft
// ---------------------------------------------------------------------------

describe('F. Preview renders from draft', () => {
  function previewFromDraft(draft: EventPageData): string {
    const resolved = resolveEventDefaults(draft);
    const context = buildEventRenderContext(draft);
    const model = mapEventToRenderModel(resolved, context, { mode: 'editorPreview' });
    return renderToString(createElement(EventPageView, { model }));
  }

  it('workshop draft with title renders hero with title', () => {
    const page = createEventPage('workshop') as WorkshopEventPage;
    page.title = { en: 'My Workshop' };
    page.subtitle = { en: 'For beginners' };
    page.heroImage = 'hero-1';
    page.dateStart = '2026-05-17';
    page.price = { amount: 45, currency: 'EUR' };
    page.description = { en: 'Learn painting.' };
    page.ctaBridge = { en: 'Ready?' };
    page.duration = { en: '3 hours' };
    page.location = { en: 'Studio' };
    const html = previewFromDraft(page);
    expect(html).toContain('My Workshop');
    expect(html).toContain('For beginners');
  });

  it('minimal draft renders heroCard section', () => {
    const page = createEventPage('minimal') as MinimalEventPage;
    page.title = { en: 'Open Night' };
    page.description = { en: 'Music and art.' };
    page.dateStart = '2026-04-25';
    page.location = { en: 'Gallery' };
    const html = previewFromDraft(page);
    expect(html).toContain('Open Night');
    expect(html).toContain('data-section="heroCard"');
  });

  it('exhibition draft renders editorial hero', () => {
    const page = createEventPage('exhibition') as ExhibitionEventPage;
    page.title = { en: 'Memory Show' };
    page.heroImage = 'hero-exh';
    page.dateStart = '2026-04-18';
    page.dateEnd = '2026-05-12';
    page.description = { en: 'Twelve works.' };
    page.location = { en: 'Milan' };
    page.hours = { en: 'Tue-Sat 11-18' };
    page.admission = { en: 'Free' };
    const html = previewFromDraft(page);
    expect(html).toContain('Memory Show');
    expect(html).toContain('data-section="heroEditorial"');
  });
});

// ---------------------------------------------------------------------------
// G. Preview reflects unsaved changes
// ---------------------------------------------------------------------------

describe('G. Preview reflects current draft state', () => {
  it('changing title in draft updates preview output', () => {
    const page = createEventPage('minimal') as MinimalEventPage;
    page.title = { en: 'Original Title' };
    page.description = { en: 'Desc' };
    page.dateStart = '2026-04-25';
    page.location = { en: 'Venue' };

    const resolved1 = resolveEventDefaults(page);
    const ctx1 = buildEventRenderContext(page);
    const model1 = mapEventToRenderModel(resolved1, ctx1, { mode: 'editorPreview' });
    const html1 = renderToString(createElement(EventPageView, { model: model1 }));
    expect(html1).toContain('Original Title');

    // Simulate draft edit (unsaved)
    const edited = { ...page, title: { en: 'Updated Title' } };
    const resolved2 = resolveEventDefaults(edited);
    const ctx2 = buildEventRenderContext(edited);
    const model2 = mapEventToRenderModel(resolved2, ctx2, { mode: 'editorPreview' });
    const html2 = renderToString(createElement(EventPageView, { model: model2 }));
    expect(html2).toContain('Updated Title');
    expect(html2).not.toContain('Original Title');
  });
});

// ---------------------------------------------------------------------------
// H. Pipeline does not crash with partial data
// ---------------------------------------------------------------------------

describe('H. Pipeline handles partial/empty drafts', () => {
  it.each(EVENT_PRESETS)('"%s" — empty draft does not crash pipeline', (preset) => {
    const page = createEventPage(preset);
    // Fresh draft — most fields are empty Localized objects or undefined
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      const resolved = resolveEventDefaults(page);
      const context = buildEventRenderContext(page);
      mapEventToRenderModel(resolved, context, { mode: 'editorPreview' });
    }).not.toThrow();
    spy.mockRestore();
  });

  it('completely empty workshop produces a model with preset field', () => {
    const page = createEventPage('workshop');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resolved = resolveEventDefaults(page);
    const context = buildEventRenderContext(page);
    const model = mapEventToRenderModel(resolved, context, { mode: 'editorPreview' });
    spy.mockRestore();
    expect(model.preset).toBe('workshop');
    // Empty draft → sections may be empty or have placeholders
    expect(model.sections).toBeDefined();
  });

  it('partially filled pleinAir does not crash', () => {
    const page = createEventPage('pleinAir') as PleinAirEventPage;
    page.title = { en: 'Coast' };
    // Missing most fields
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      const resolved = resolveEventDefaults(page);
      const context = buildEventRenderContext(page);
      const model = mapEventToRenderModel(resolved, context, { mode: 'editorPreview' });
      renderToString(createElement(EventPageView, { model }));
    }).not.toThrow();
    spy.mockRestore();
  });
});
