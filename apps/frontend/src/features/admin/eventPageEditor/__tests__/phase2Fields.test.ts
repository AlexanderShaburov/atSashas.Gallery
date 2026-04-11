import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { createEventPage } from '@/entities/event/eventFactory';
import { CREATION_DEFAULTS, RENDER_DEFAULTS } from '@/entities/event/eventDefaults';
import { resolveEventDefaults } from '@/entities/event/resolveEventDefaults';
import { buildEventRenderContext } from '@/entities/event/eventRenderContext';
import { mapEventToRenderModel } from '@/features/public/eventPage/mapEventToRenderModel';
import { EventPageView } from '@/features/public/eventPage/EventPageView';
import { EVENT_PRESETS } from '@/entities/event/eventPage.types';
import type {
  EventPageData,
  EventPreset,
  WorkshopEventPage,
  PleinAirEventPage,
  ExhibitionEventPage,
  MinimalEventPage,
} from '@/entities/event/eventPage.types';

import { isFieldVisible, FIELD_VISIBILITY } from '../ui/fieldVisibility';

// ---------------------------------------------------------------------------
// A. Field visibility — comprehensive preset × field coverage
// ---------------------------------------------------------------------------

describe('A. Field visibility map', () => {
  it('all 4 presets have entries for all tracked fields', () => {
    for (const preset of EVENT_PRESETS) {
      const entry = FIELD_VISIBILITY[preset];
      expect(entry).toBeDefined();
      // Spot-check some known fields
      expect(typeof entry.title).toBe('boolean');
      expect(typeof entry.ctaLabel).toBe('boolean');
      expect(typeof entry.heroImage).toBe('boolean');
    }
  });

  // Content fields
  it('subtitle visible for workshop and pleinAir, hidden for exhibition and minimal', () => {
    expect(isFieldVisible('workshop', 'subtitle')).toBe(true);
    expect(isFieldVisible('pleinAir', 'subtitle')).toBe(true);
    expect(isFieldVisible('exhibition', 'subtitle')).toBe(false);
    expect(isFieldVisible('minimal', 'subtitle')).toBe(false);
  });

  it('bridgeLine visible only for pleinAir', () => {
    expect(isFieldVisible('pleinAir', 'bridgeLine')).toBe(true);
    expect(isFieldVisible('workshop', 'bridgeLine')).toBe(false);
    expect(isFieldVisible('exhibition', 'bridgeLine')).toBe(false);
    expect(isFieldVisible('minimal', 'bridgeLine')).toBe(false);
  });

  it('extendedDescription visible only for minimal', () => {
    expect(isFieldVisible('minimal', 'extendedDescription')).toBe(true);
    expect(isFieldVisible('workshop', 'extendedDescription')).toBe(false);
  });

  it('hostNote visible for workshop, pleinAir, exhibition but not minimal', () => {
    expect(isFieldVisible('workshop', 'hostNote')).toBe(true);
    expect(isFieldVisible('pleinAir', 'hostNote')).toBe(true);
    expect(isFieldVisible('exhibition', 'hostNote')).toBe(true);
    expect(isFieldVisible('minimal', 'hostNote')).toBe(false);
  });

  // Logistics fields
  it('duration visible only for workshop', () => {
    expect(isFieldVisible('workshop', 'duration')).toBe(true);
    expect(isFieldVisible('pleinAir', 'duration')).toBe(false);
  });

  it('sessions visible only for pleinAir', () => {
    expect(isFieldVisible('pleinAir', 'sessions')).toBe(true);
    expect(isFieldVisible('workshop', 'sessions')).toBe(false);
  });

  it('exhibition has hours, admission, openingDate, openingTime', () => {
    expect(isFieldVisible('exhibition', 'hours')).toBe(true);
    expect(isFieldVisible('exhibition', 'admission')).toBe(true);
    expect(isFieldVisible('exhibition', 'openingDate')).toBe(true);
    expect(isFieldVisible('exhibition', 'openingTime')).toBe(true);
  });

  it('minimal has time but not duration or sessions', () => {
    expect(isFieldVisible('minimal', 'time')).toBe(true);
    expect(isFieldVisible('minimal', 'duration')).toBe(false);
    expect(isFieldVisible('minimal', 'sessions')).toBe(false);
  });

  // CTA fields
  it('ctaBridge visible for workshop and pleinAir only', () => {
    expect(isFieldVisible('workshop', 'ctaBridge')).toBe(true);
    expect(isFieldVisible('pleinAir', 'ctaBridge')).toBe(true);
    expect(isFieldVisible('exhibition', 'ctaBridge')).toBe(false);
    expect(isFieldVisible('minimal', 'ctaBridge')).toBe(false);
  });

  it('secondaryAction visible only for exhibition', () => {
    expect(isFieldVisible('exhibition', 'secondaryAction')).toBe(true);
    expect(isFieldVisible('workshop', 'secondaryAction')).toBe(false);
  });

  // Label overrides
  it('descriptionLabel visible only for exhibition', () => {
    expect(isFieldVisible('exhibition', 'descriptionLabel')).toBe(true);
    expect(isFieldVisible('workshop', 'descriptionLabel')).toBe(false);
  });

  it('experienceTitle visible for workshop and pleinAir', () => {
    expect(isFieldVisible('workshop', 'experienceTitle')).toBe(true);
    expect(isFieldVisible('pleinAir', 'experienceTitle')).toBe(true);
    expect(isFieldVisible('exhibition', 'experienceTitle')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// B. New field binding — CTA and logistics fields
// ---------------------------------------------------------------------------

describe('B. New field binding', () => {
  it('CTA fields bind to workshop draft', () => {
    const page = createEventPage('workshop') as WorkshopEventPage;
    const updated = { ...page, ctaBridge: { en: 'Custom bridge' }, cancellationNote: { en: 'Refund OK' } };
    expect(updated.ctaBridge.en).toBe('Custom bridge');
    expect(updated.cancellationNote!.en).toBe('Refund OK');
    expect(updated.ctaLabel).toEqual(CREATION_DEFAULTS.workshop.ctaLabel);
  });

  it('logistics fields bind to pleinAir draft', () => {
    const page = createEventPage('pleinAir') as PleinAirEventPage;
    const updated = {
      ...page,
      dateStart: '2026-06-14',
      dateEnd: '2026-06-15',
      sessions: { en: '2 mornings' },
      meetingPoint: { en: 'Camogli harbor' },
      groupSize: 8,
    };
    expect(updated.dateEnd).toBe('2026-06-15');
    expect(updated.sessions!.en).toBe('2 mornings');
    expect(updated.groupSize).toBe(8);
  });

  it('exhibition visit fields bind correctly', () => {
    const page = createEventPage('exhibition') as ExhibitionEventPage;
    const updated = {
      ...page,
      openingDate: '2026-04-18',
      openingTime: '18:00',
      hours: { en: 'Tue–Sat 11–18' },
      admission: { en: 'Free' },
    };
    expect(updated.openingDate).toBe('2026-04-18');
    expect(updated.hours!.en).toBe('Tue–Sat 11–18');
  });

  it('minimal extendedDescription and time bind correctly', () => {
    const page = createEventPage('minimal') as MinimalEventPage;
    const record = page as unknown as Record<string, unknown>;
    const updated = { ...record, extendedDescription: { en: 'Extra details' }, time: '19:00' };
    expect((updated.extendedDescription as { en: string }).en).toBe('Extra details');
    expect(updated.time).toBe('19:00');
  });

  it('hostNote and hostName bind to workshop', () => {
    const page = createEventPage('workshop') as WorkshopEventPage;
    const updated = { ...page, hostNote: { en: 'Come prepared' }, hostName: 'Sasha' };
    expect(updated.hostNote!.en).toBe('Come prepared');
    expect(updated.hostName).toBe('Sasha');
  });
});

// ---------------------------------------------------------------------------
// C. Hidden fields preserved but inert (C2 contract)
// ---------------------------------------------------------------------------

describe('C. Hidden-field behavior (C2)', () => {
  it('foreign field survives serialization', () => {
    const page = createEventPage('exhibition') as ExhibitionEventPage;
    // Inject a field that belongs to Workshop, not Exhibition
    const record = page as unknown as Record<string, unknown>;
    record['duration'] = { en: '3 hours' };
    const roundTripped = JSON.parse(JSON.stringify(record));
    expect(roundTripped.duration.en).toBe('3 hours');
    expect(roundTripped.preset).toBe('exhibition');
  });

  it('foreign field does not appear in preview', () => {
    const page = createEventPage('exhibition') as ExhibitionEventPage;
    // Fill required fields for preview + inject foreign field
    page.title = { en: 'Test Exhibition' };
    page.heroImage = 'hero-1';
    page.dateStart = '2026-04-18';
    page.dateEnd = '2026-05-12';
    page.description = { en: 'Art show.' };
    page.location = { en: 'Milan' };
    page.hours = { en: 'Tue–Sat 11–18' };
    page.admission = { en: 'Free' };

    // Inject foreign field
    (page as unknown as Record<string, unknown>)['duration'] = { en: '3 hours' };

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resolved = resolveEventDefaults(page);
    const ctx = buildEventRenderContext(page);
    const model = mapEventToRenderModel(resolved, ctx, { mode: 'editorPreview' });
    spy.mockRestore();

    // "3 hours" should NOT appear in output (no section consumes duration for exhibition)
    const html = renderToString(createElement(EventPageView, { model }));
    expect(html).not.toContain('3 hours');
    // But the title should appear
    expect(html).toContain('Test Exhibition');
  });
});

// ---------------------------------------------------------------------------
// D. CTA and settings fields per preset
// ---------------------------------------------------------------------------

describe('D. CTA defaults and settings', () => {
  it.each(EVENT_PRESETS)('"%s" has ctaLabel creation default', (preset) => {
    const page = createEventPage(preset);
    expect(page.ctaLabel).toBeDefined();
    const defaultLabel = CREATION_DEFAULTS[preset].ctaLabel;
    expect(page.ctaLabel).toEqual(defaultLabel);
  });

  it('workshop and pleinAir have ctaBridge creation default', () => {
    const ws = createEventPage('workshop') as WorkshopEventPage;
    expect(ws.ctaBridge).toBeDefined();
    const pa = createEventPage('pleinAir') as PleinAirEventPage;
    expect(pa.ctaBridge).toBeDefined();
  });

  it('label overrides resolve from RENDER_DEFAULTS when absent', () => {
    const page = createEventPage('workshop') as WorkshopEventPage;
    const resolved = resolveEventDefaults(page);
    const r = resolved as unknown as Record<string, unknown>;
    expect(r['experienceTitle']).toEqual(RENDER_DEFAULTS.workshop.experienceTitle);
  });

  it('label override takes precedence when set', () => {
    const page = createEventPage('workshop') as WorkshopEventPage;
    (page as unknown as Record<string, unknown>)['experienceTitle'] = { en: 'Custom Title' };
    const resolved = resolveEventDefaults(page);
    const r = resolved as unknown as Record<string, unknown>;
    expect(r['experienceTitle']).toEqual({ en: 'Custom Title' });
  });

  it('clearing label override restores default', () => {
    const page = createEventPage('workshop') as WorkshopEventPage;
    (page as unknown as Record<string, unknown>)['experienceTitle'] = { en: 'Custom' };
    (page as unknown as Record<string, unknown>)['experienceTitle'] = undefined;
    const resolved = resolveEventDefaults(page);
    const r = resolved as unknown as Record<string, unknown>;
    expect(r['experienceTitle']).toEqual(RENDER_DEFAULTS.workshop.experienceTitle);
  });
});

// ---------------------------------------------------------------------------
// E. Preview with richer drafts
// ---------------------------------------------------------------------------

describe('E. Preview with expanded fields', () => {
  function preview(draft: EventPageData): string {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resolved = resolveEventDefaults(draft);
    const ctx = buildEventRenderContext(draft);
    const model = mapEventToRenderModel(resolved, ctx, { mode: 'editorPreview' });
    const html = renderToString(createElement(EventPageView, { model }));
    spy.mockRestore();
    return html;
  }

  it('workshop with hostNote shows hostNote in preview', () => {
    const page = createEventPage('workshop') as WorkshopEventPage;
    page.title = { en: 'WS' };
    page.subtitle = { en: 'Sub' };
    page.heroImage = 'h';
    page.dateStart = '2026-05-17';
    page.duration = { en: '3h' };
    page.location = { en: 'Loc' };
    page.price = { amount: 10, currency: 'EUR' };
    page.description = { en: 'Desc' };
    page.hostNote = { en: 'Welcome!' };
    page.hostName = 'Sasha';
    page.ctaBridge = { en: 'Go' };
    const html = preview(page);
    expect(html).toContain('Welcome!');
    expect(html).toContain('Sasha');
  });

  it('pleinAir with bridge line shows bridge in preview', () => {
    const page = createEventPage('pleinAir') as PleinAirEventPage;
    page.title = { en: 'Coast' };
    page.subtitle = { en: 'Paint' };
    page.heroImage = 'h';
    page.bridgeLine = { en: 'Paint where the light is.' };
    page.description = { en: 'Desc' };
    page.location = { en: 'Camogli' };
    page.ctaBridge = { en: 'Go' };
    const html = preview(page);
    expect(html).toContain('Paint where the light is.');
  });

  it('exhibition with visit details shows visitCta in preview', () => {
    const page = createEventPage('exhibition') as ExhibitionEventPage;
    page.title = { en: 'Show' };
    page.heroImage = 'h';
    page.dateStart = '2026-04-18';
    page.dateEnd = '2026-05-12';
    page.description = { en: 'Art.' };
    page.location = { en: 'Milan' };
    page.hours = { en: 'Tue–Sat 11–18' };
    page.admission = { en: 'Free' };
    page.featuredWorks = [
      { image: 'w1', title: { en: 'A' } },
      { image: 'w2', title: { en: 'B' } },
      { image: 'w3', title: { en: 'C' } },
      { image: 'w4', title: { en: 'D' } },
    ];
    const html = preview(page);
    expect(html).toContain('Tue–Sat 11–18');
    expect(html).toContain('data-section="visitCta"');
  });

  it('minimal with extendedDescription shows description section', () => {
    const page = createEventPage('minimal') as MinimalEventPage;
    page.title = { en: 'Night' };
    page.description = { en: 'Short.' };
    page.dateStart = '2026-04-25';
    page.location = { en: 'Studio' };
    (page as unknown as Record<string, unknown>).extendedDescription = { en: 'More details here.' };
    const html = preview(page);
    expect(html).toContain('More details here.');
  });
});

// ---------------------------------------------------------------------------
// F. Partial drafts still safe
// ---------------------------------------------------------------------------

describe('F. Partial draft safety', () => {
  it.each(EVENT_PRESETS)('"%s" with only title+description does not crash preview', (preset) => {
    const page = createEventPage(preset);
    (page as unknown as Record<string, unknown>).title = { en: 'Test' };
    (page as unknown as Record<string, unknown>).description = { en: 'Desc' };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      const resolved = resolveEventDefaults(page);
      const ctx = buildEventRenderContext(page);
      const model = mapEventToRenderModel(resolved, ctx, { mode: 'editorPreview' });
      renderToString(createElement(EventPageView, { model }));
    }).not.toThrow();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// G. Save round-trip with expanded data
// ---------------------------------------------------------------------------

describe('G. Expanded draft serialization', () => {
  it('full workshop draft survives JSON round-trip', () => {
    const page = createEventPage('workshop') as WorkshopEventPage;
    page.title = { en: 'WS' };
    page.subtitle = { en: 'Sub' };
    page.description = { en: 'Desc' };
    page.dateStart = '2026-05-17';
    page.duration = { en: '3 hours' };
    page.location = { en: 'Studio' };
    page.mapUrl = 'https://maps.google.com/test';
    page.price = { amount: 45, currency: 'EUR' };
    page.capacity = 12;
    page.hostNote = { en: 'Welcome' };
    page.hostName = 'Sasha';
    page.ctaBridge = { en: 'Go' };
    page.cancellationNote = { en: 'Free cancel' };

    const rt = JSON.parse(JSON.stringify(page));
    expect(rt.duration.en).toBe('3 hours');
    expect(rt.capacity).toBe(12);
    expect(rt.hostNote.en).toBe('Welcome');
    expect(rt.hostName).toBe('Sasha');
    expect(rt.cancellationNote.en).toBe('Free cancel');
    expect(rt.mapUrl).toBe('https://maps.google.com/test');
  });

  it('full pleinAir draft survives JSON round-trip', () => {
    const page = createEventPage('pleinAir') as PleinAirEventPage;
    page.dateStart = '2026-06-14';
    page.dateEnd = '2026-06-15';
    page.sessions = { en: '2 mornings' };
    page.meetingPoint = { en: 'Harbor' };
    page.groupSize = 8;
    page.bridgeLine = { en: 'Paint!' };

    const rt = JSON.parse(JSON.stringify(page));
    expect(rt.dateEnd).toBe('2026-06-15');
    expect(rt.sessions.en).toBe('2 mornings');
    expect(rt.meetingPoint.en).toBe('Harbor');
    expect(rt.groupSize).toBe(8);
    expect(rt.bridgeLine.en).toBe('Paint!');
  });
});
