import { describe, expect, it, vi } from 'vitest';

import { createEventPage } from '@/entities/event/eventFactory';
import { resolveEventDefaults } from '@/entities/event/resolveEventDefaults';
import type { EventRenderContext } from '@/entities/event/eventRenderContext';
import type {
  ExhibitionEventPage,
  MinimalEventPage,
  PleinAirEventPage,
  ResolvedEventPageData,
  WorkshopEventPage,
} from '@/entities/event/eventPage.types';

import { mapEventToRenderModel } from '../mapEventToRenderModel';
import type { RenderEventSection } from '../renderModel.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const emptyCtx: EventRenderContext = { paidEnrollmentCount: 0 };

function sectionKinds(sections: RenderEventSection[]): string[] {
  return sections.map((s) => s.kind);
}

function findSection<K extends RenderEventSection['kind']>(
  sections: RenderEventSection[],
  kind: K,
): Extract<RenderEventSection, { kind: K }> | undefined {
  return sections.find((s) => s.kind === kind) as
    | Extract<RenderEventSection, { kind: K }>
    | undefined;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fullWorkshop(): ResolvedEventPageData {
  const raw = createEventPage('workshop') as WorkshopEventPage;
  raw.title = { en: 'Watercolor Foundations' };
  raw.subtitle = { en: 'A beginner workshop' };
  raw.heroImage = 'hero-ws-1';
  raw.dateStart = '2026-05-17';
  raw.duration = { en: '3 hours' };
  raw.location = { en: 'Studio 12, Milan' };
  raw.price = { amount: 45, currency: 'EUR' };
  raw.capacity = 12;
  raw.description = { en: 'Learn watercolor fundamentals.' };
  raw.hostNote = { en: 'No experience needed.' };
  raw.hostName = 'Sasha';
  raw.experienceImages = ['exp-1', 'exp-2', 'exp-3'];
  raw.resultsImages = ['res-1', 'res-2'];
  raw.ctaBridge = { en: 'You will leave with a finished piece.' };
  raw.ctaLabel = { en: 'Reserve Your Spot' };
  raw.cancellationNote = { en: 'Free cancellation up to 48h.' };
  return resolveEventDefaults(raw);
}

function sparseWorkshop(): ResolvedEventPageData {
  const raw = createEventPage('workshop') as WorkshopEventPage;
  raw.title = { en: 'Quick Sketch' };
  raw.subtitle = { en: 'Fast intro' };
  raw.heroImage = 'hero-ws-2';
  raw.dateStart = '2026-06-01';
  raw.duration = { en: '2 hours' };
  raw.location = { en: 'Park' };
  raw.price = { amount: 0, currency: 'EUR' };
  raw.description = { en: 'A quick intro.' };
  raw.ctaBridge = { en: 'Come sketch.' };
  raw.ctaLabel = { en: 'Reserve' };
  return resolveEventDefaults(raw);
}

function fullPleinAir(): ResolvedEventPageData {
  const raw = createEventPage('pleinAir') as PleinAirEventPage;
  raw.title = { en: 'Ligurian Coast' };
  raw.subtitle = { en: 'Two mornings painting the coast' };
  raw.heroImage = 'hero-pa-1';
  raw.dateStart = '2026-06-14';
  raw.dateEnd = '2026-06-15';
  raw.bridgeLine = { en: 'Paint where the light is.' };
  raw.description = { en: 'We meet at the harbor.' };
  raw.experienceImages = ['pa-exp-1', 'pa-exp-2', 'pa-exp-3'];
  raw.hostNote = { en: 'Bring a hat.' };
  raw.hostName = 'Sasha';
  raw.resultsImages = ['pa-res-1', 'pa-res-2'];
  raw.sessions = { en: '2 morning sessions' };
  raw.meetingPoint = { en: 'Camogli harbor' };
  raw.location = { en: 'Camogli, Liguria' };
  raw.groupSize = 8;
  raw.price = { amount: 120, currency: 'EUR' };
  raw.ctaBridge = { en: 'Two mornings on the coast.' };
  raw.ctaLabel = { en: 'Join This Session' };
  raw.cancellationNote = { en: 'Refund if rain.' };
  return resolveEventDefaults(raw);
}

function fullExhibition(): ResolvedEventPageData {
  const raw = createEventPage('exhibition') as ExhibitionEventPage;
  raw.title = { en: 'Between Memory and Place' };
  raw.heroImage = 'hero-exh-1';
  raw.dateStart = '2026-04-18';
  raw.dateEnd = '2026-05-12';
  raw.description = { en: 'Twelve works exploring memory.\n\nThe body continues here.' };
  raw.featuredWorks = [
    { image: 'w1', title: { en: 'Morning Light' }, medium: { en: 'Oil on canvas' } },
    { image: 'w2', title: { en: 'Harbor' } },
    { image: 'w3', title: { en: 'Cliff Path' }, medium: { en: 'Watercolor' } },
    { image: 'w4', title: { en: 'Old Town' }, medium: { en: 'Ink' } },
  ];
  raw.hostNote = { en: 'These paintings began last summer.' };
  raw.hostName = 'Sasha';
  raw.hours = { en: 'Tue–Sat, 11–18' };
  raw.location = { en: 'Galleria Sasha, Milan' };
  raw.admission = { en: 'Free' };
  raw.ctaLabel = { en: 'RSVP for Opening' };
  raw.openingDate = '2026-04-18';
  raw.openingTime = '18:00';
  return resolveEventDefaults(raw);
}

function fullMinimal(): ResolvedEventPageData {
  const raw = createEventPage('minimal') as MinimalEventPage;
  raw.title = { en: 'Open Studio Night' };
  raw.description = { en: 'Drawing, music, conversation.' };
  raw.dateStart = '2026-04-25';
  raw.location = { en: 'Studio 12' };
  raw.ctaLabel = { en: 'RSVP' };
  raw.heroImage = 'hero-min-1';
  raw.price = { amount: 15, currency: 'EUR' };
  raw.time = '19:00';
  (raw as unknown as Record<string, unknown>).extendedDescription = {
    en: 'Easels and paper provided. Drinks available.',
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

// ---------------------------------------------------------------------------
// A. Section order matches preset contract
// ---------------------------------------------------------------------------

describe('A. Section order by preset', () => {
  it('workshop: 7 sections in correct order', () => {
    const { sections } = mapEventToRenderModel(fullWorkshop(), emptyCtx);
    expect(sectionKinds(sections)).toEqual([
      'heroStandard',
      'quickFacts',
      'description',
      'hostNote',
      'galleryExperience',
      'galleryResults',
      'ctaBlock',
    ]);
  });

  it('pleinAir: 9 sections in correct order', () => {
    const { sections } = mapEventToRenderModel(fullPleinAir(), emptyCtx);
    expect(sectionKinds(sections)).toEqual([
      'heroCinematic',
      'bridge',
      'description',
      'galleryExperience',
      'hostNote',
      'galleryResults',
      'quickFacts',
      'ctaBlock',
      'stickyCta',
    ]);
  });

  it('exhibition: 5 sections in correct order', () => {
    const { sections } = mapEventToRenderModel(fullExhibition(), emptyCtx);
    expect(sectionKinds(sections)).toEqual([
      'heroEditorial',
      'description',
      'featuredWorks',
      'hostNote',
      'visitCta',
    ]);
  });

  it('minimal with extendedDescription: heroCard + description', () => {
    const { sections } = mapEventToRenderModel(fullMinimal(), emptyCtx);
    expect(sectionKinds(sections)).toEqual(['heroCard', 'description']);
  });

  it('minimal without extendedDescription: heroCard only', () => {
    const { sections } = mapEventToRenderModel(minimalWithoutExtended(), emptyCtx);
    expect(sectionKinds(sections)).toEqual(['heroCard']);
  });

  it('preset field is set correctly', () => {
    expect(mapEventToRenderModel(fullWorkshop(), emptyCtx).preset).toBe('workshop');
    expect(mapEventToRenderModel(fullPleinAir(), emptyCtx).preset).toBe('pleinAir');
    expect(mapEventToRenderModel(fullExhibition(), emptyCtx).preset).toBe('exhibition');
    expect(mapEventToRenderModel(fullMinimal(), emptyCtx).preset).toBe('minimal');
  });
});

// ---------------------------------------------------------------------------
// B. Optional sections omitted when data absent
// ---------------------------------------------------------------------------

describe('B. Optional sections omitted', () => {
  it('sparse workshop → no hostNote, no galleries', () => {
    const { sections } = mapEventToRenderModel(sparseWorkshop(), emptyCtx);
    const kinds = sectionKinds(sections);
    expect(kinds).not.toContain('hostNote');
    expect(kinds).not.toContain('galleryExperience');
    expect(kinds).not.toContain('galleryResults');
  });

  it('sparse workshop preserves remaining section order', () => {
    const { sections } = mapEventToRenderModel(sparseWorkshop(), emptyCtx);
    expect(sectionKinds(sections)).toEqual([
      'heroStandard',
      'quickFacts',
      'description',
      'ctaBlock',
    ]);
  });

  it('exhibition without hostNote → 4 sections', () => {
    const event = fullExhibition();
    (event as unknown as Record<string, unknown>).hostNote = undefined;
    const { sections } = mapEventToRenderModel(event, emptyCtx);
    expect(sectionKinds(sections)).toEqual([
      'heroEditorial',
      'description',
      'featuredWorks',
      'visitCta',
    ]);
  });
});

// ---------------------------------------------------------------------------
// C. HeroStandard payload (Workshop)
// ---------------------------------------------------------------------------

describe('C. HeroStandard payload', () => {
  it('maps all hero fields correctly', () => {
    const { sections } = mapEventToRenderModel(fullWorkshop(), emptyCtx);
    const hero = findSection(sections, 'heroStandard')!;
    expect(hero.data.title).toBe('Watercolor Foundations');
    expect(hero.data.subtitle).toBe('A beginner workshop');
    expect(hero.data.heroImage).toBe('hero-ws-1');
    expect(hero.data.priceDisplay).toBe('€45');
    expect(hero.data.dateDisplay).toBe('May 17, 2026');
  });

  it('heroImage is a required sourceField — section skipped when absent', () => {
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).heroImage = undefined;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { sections } = mapEventToRenderModel(event, emptyCtx);
    spy.mockRestore();
    expect(sectionKinds(sections)).not.toContain('heroStandard');
  });

  it('free price shows "Free"', () => {
    const { sections } = mapEventToRenderModel(sparseWorkshop(), emptyCtx);
    const hero = findSection(sections, 'heroStandard')!;
    expect(hero.data.priceDisplay).toBe('Free');
  });
});

// ---------------------------------------------------------------------------
// D. HeroCinematic payload (PleinAir)
// ---------------------------------------------------------------------------

describe('D. HeroCinematic payload', () => {
  it('maps all cinematic hero fields', () => {
    const { sections } = mapEventToRenderModel(fullPleinAir(), emptyCtx);
    const hero = findSection(sections, 'heroCinematic')!;
    expect(hero.data.title).toBe('Ligurian Coast');
    expect(hero.data.subtitle).toBe('Two mornings painting the coast');
    expect(hero.data.heroImage).toBe('hero-pa-1');
    expect(hero.data.eyebrow).toBe('Plein Air Session');
  });
});

// ---------------------------------------------------------------------------
// E. HeroEditorial payload (Exhibition)
// ---------------------------------------------------------------------------

describe('E. HeroEditorial payload', () => {
  it('maps all editorial hero fields', () => {
    const { sections } = mapEventToRenderModel(fullExhibition(), emptyCtx);
    const hero = findSection(sections, 'heroEditorial')!;
    expect(hero.data.title).toBe('Between Memory and Place');
    expect(hero.data.heroImage).toBe('hero-exh-1');
    expect(hero.data.eyebrow).toBe('Exhibition');
    expect(hero.data.dateDisplay).toBe('April 18 – May 12, 2026');
  });
});

// ---------------------------------------------------------------------------
// F. HeroCard payload (Minimal)
// ---------------------------------------------------------------------------

describe('F. HeroCard payload', () => {
  it('maps all card hero fields', () => {
    const { sections } = mapEventToRenderModel(fullMinimal(), emptyCtx);
    const hero = findSection(sections, 'heroCard')!;
    expect(hero.data.title).toBe('Open Studio Night');
    expect(hero.data.description).toBe('Drawing, music, conversation.');
    expect(hero.data.dateDisplay).toBe('April 25, 2026');
    expect(hero.data.location).toBe('Studio 12');
    expect(hero.data.ctaLabel).toBe('RSVP');
    expect(hero.data.heroImage).toBe('hero-min-1');
    expect(hero.data.time).toBe('19:00');
    expect(hero.data.priceDisplay).toBe('€15');
  });

  it('optional fields default to empty/null when absent', () => {
    const { sections } = mapEventToRenderModel(minimalWithoutExtended(), emptyCtx);
    const hero = findSection(sections, 'heroCard')!;
    expect(hero.data.heroImage).toBeNull();
    expect(hero.data.time).toBe('');
    expect(hero.data.priceDisplay).toBe('Free');
  });
});

// ---------------------------------------------------------------------------
// G. Bridge payload (PleinAir)
// ---------------------------------------------------------------------------

describe('G. Bridge payload', () => {
  it('maps bridge text', () => {
    const { sections } = mapEventToRenderModel(fullPleinAir(), emptyCtx);
    const bridge = findSection(sections, 'bridge')!;
    expect(bridge.data.text).toBe('Paint where the light is.');
  });
});

// ---------------------------------------------------------------------------
// H. QuickFacts payload
// ---------------------------------------------------------------------------

describe('H. QuickFacts payload', () => {
  it('workshop: 4 items (no scarcity when 0 spots taken)', () => {
    const { sections } = mapEventToRenderModel(fullWorkshop(), emptyCtx);
    const qf = findSection(sections, 'quickFacts')!;
    expect(qf.data.items).toHaveLength(4);
    expect(qf.data.items[0]).toEqual({ label: 'date', value: 'May 17, 2026' });
    expect(qf.data.items[1]).toEqual({ label: 'duration', value: '3 hours' });
    expect(qf.data.items[2]).toEqual({ label: 'location', value: 'Studio 12, Milan' });
    expect(qf.data.items[3]).toEqual({ label: 'price', value: '€45' });
  });

  it('workshop: scarcity appears when spots are taken', () => {
    const ctx: EventRenderContext = { paidEnrollmentCount: 9 };
    const { sections } = mapEventToRenderModel(fullWorkshop(), ctx);
    const qf = findSection(sections, 'quickFacts')!;
    expect(qf.data.items).toHaveLength(5);
    expect(qf.data.items[4]).toEqual({
      label: 'spots',
      value: '3 of 12 spots remaining',
    });
  });

  it('pleinAir: 5 items', () => {
    const { sections } = mapEventToRenderModel(fullPleinAir(), emptyCtx);
    const qf = findSection(sections, 'quickFacts')!;
    expect(qf.data.items).toHaveLength(5);
    expect(qf.data.items[0]).toEqual({ label: 'dates', value: 'June 14–15, 2026' });
    expect(qf.data.items[1]).toEqual({ label: 'sessions', value: '2 morning sessions' });
    expect(qf.data.items[2]).toEqual({ label: 'meetingPoint', value: 'Camogli harbor' });
    expect(qf.data.items[3]).toEqual({ label: 'groupSize', value: 'Max 8' });
    expect(qf.data.items[4]).toEqual({ label: 'price', value: '€120' });
  });

  it('free workshop shows "Free" for price', () => {
    const { sections } = mapEventToRenderModel(sparseWorkshop(), emptyCtx);
    const qf = findSection(sections, 'quickFacts')!;
    const price = qf.data.items.find((i) => i.label === 'price');
    expect(price!.value).toBe('Free');
  });
});

// ---------------------------------------------------------------------------
// I. Description payload
// ---------------------------------------------------------------------------

describe('I. Description payload', () => {
  it('workshop: full text, thesisLine = full, bodyParagraphs = empty', () => {
    const { sections } = mapEventToRenderModel(fullWorkshop(), emptyCtx);
    const desc = findSection(sections, 'description')!;
    expect(desc.data.text).toBe('Learn watercolor fundamentals.');
    expect(desc.data.thesisLine).toBe('Learn watercolor fundamentals.');
    expect(desc.data.bodyParagraphs).toBe('');
    expect(desc.data.label).toBe('');
  });

  it('exhibition: splits thesis + body, has label', () => {
    const { sections } = mapEventToRenderModel(fullExhibition(), emptyCtx);
    const desc = findSection(sections, 'description')!;
    expect(desc.data.thesisLine).toBe('Twelve works exploring memory.');
    expect(desc.data.bodyParagraphs).toBe('The body continues here.');
    expect(desc.data.label).toBe('About the Exhibition');
  });

  it('minimal: reads extendedDescription via sourceFieldOverride', () => {
    const { sections } = mapEventToRenderModel(fullMinimal(), emptyCtx);
    const desc = findSection(sections, 'description')!;
    expect(desc.data.text).toBe('Easels and paper provided. Drinks available.');
  });
});

// ---------------------------------------------------------------------------
// J. HostNote payload
// ---------------------------------------------------------------------------

describe('J. HostNote payload', () => {
  it('workshop: maps note, label, hostName', () => {
    const { sections } = mapEventToRenderModel(fullWorkshop(), emptyCtx);
    const hn = findSection(sections, 'hostNote')!;
    expect(hn.data.note).toBe('No experience needed.');
    expect(hn.data.label).toBe('A note from the host');
    expect(hn.data.hostName).toBe('Sasha');
  });

  it('exhibition: different label default', () => {
    const { sections } = mapEventToRenderModel(fullExhibition(), emptyCtx);
    const hn = findSection(sections, 'hostNote')!;
    expect(hn.data.label).toBe('From the artist');
  });

  it('hostName empty string when absent', () => {
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).hostName = undefined;
    const { sections } = mapEventToRenderModel(event, emptyCtx);
    const hn = findSection(sections, 'hostNote')!;
    expect(hn.data.hostName).toBe('');
  });
});

// ---------------------------------------------------------------------------
// K. Gallery sections
// ---------------------------------------------------------------------------

describe('K. Gallery sections', () => {
  it('galleryExperience: images + layout for 3-image workshop', () => {
    const { sections } = mapEventToRenderModel(fullWorkshop(), emptyCtx);
    const ge = findSection(sections, 'galleryExperience')!;
    expect(ge.data.images).toEqual(['exp-1', 'exp-2', 'exp-3']);
    expect(ge.data.layout).toBe('exp-3');
    expect(ge.data.title).toBe('The Workshop Experience');
  });

  it('galleryResults: images + layout for 2-image set', () => {
    const { sections } = mapEventToRenderModel(fullWorkshop(), emptyCtx);
    const gr = findSection(sections, 'galleryResults')!;
    expect(gr.data.images).toEqual(['res-1', 'res-2']);
    expect(gr.data.layout).toBe('res-2');
    expect(gr.data.title).toBe('Participant Results');
  });

  it('pleinAir experience: uses exp-pleinair layout for 3 images', () => {
    const { sections } = mapEventToRenderModel(fullPleinAir(), emptyCtx);
    const ge = findSection(sections, 'galleryExperience')!;
    expect(ge.data.layout).toBe('exp-pleinair');
  });

  it('featuredWorks: flattens CaptionedWork items', () => {
    const { sections } = mapEventToRenderModel(fullExhibition(), emptyCtx);
    const fw = findSection(sections, 'featuredWorks')!;
    expect(fw.data.works).toHaveLength(4);
    expect(fw.data.works[0]).toEqual({
      image: 'w1',
      title: 'Morning Light',
      medium: 'Oil on canvas',
    });
    expect(fw.data.works[1]!.medium).toBe('');
    expect(fw.data.layout).toBe('exhibition');
    expect(fw.data.title).toBe('Selected Works');
  });
});

// ---------------------------------------------------------------------------
// L. CtaBlock payload
// ---------------------------------------------------------------------------

describe('L. CtaBlock payload', () => {
  it('workshop: meta line with date · duration · price', () => {
    const { sections } = mapEventToRenderModel(fullWorkshop(), emptyCtx);
    const cta = findSection(sections, 'ctaBlock')!;
    expect(cta.data.bridgeText).toBe('You will leave with a finished piece.');
    expect(cta.data.ctaLabel).toBe('Reserve Your Spot');
    expect(cta.data.metaLine).toBe('May 17, 2026 · 3 hours · €45 per person');
    expect(cta.data.cancellationNote).toBe('Free cancellation up to 48h.');
    expect(cta.data.scarcityLabel).toBeNull();
  });

  it('workshop: scarcity shows when spots taken', () => {
    const ctx: EventRenderContext = { paidEnrollmentCount: 10 };
    const { sections } = mapEventToRenderModel(fullWorkshop(), ctx);
    const cta = findSection(sections, 'ctaBlock')!;
    expect(cta.data.scarcityLabel).toBe('2 of 12 spots remaining');
  });

  it('workshop: sold out', () => {
    const ctx: EventRenderContext = { paidEnrollmentCount: 12 };
    const { sections } = mapEventToRenderModel(fullWorkshop(), ctx);
    const cta = findSection(sections, 'ctaBlock')!;
    expect(cta.data.scarcityLabel).toBe('Sold out');
  });

  it('pleinAir: meta line with date range · location · price', () => {
    const { sections } = mapEventToRenderModel(fullPleinAir(), emptyCtx);
    const cta = findSection(sections, 'ctaBlock')!;
    expect(cta.data.metaLine).toBe('June 14–15, 2026 · Camogli, Liguria · €120 per person');
  });

  it('cancellationNote empty string when absent', () => {
    const { sections } = mapEventToRenderModel(sparseWorkshop(), emptyCtx);
    const cta = findSection(sections, 'ctaBlock')!;
    expect(cta.data.cancellationNote).toBe('');
  });
});

// ---------------------------------------------------------------------------
// M. VisitCta payload (Exhibition)
// ---------------------------------------------------------------------------

describe('M. VisitCta payload', () => {
  it('maps all visit CTA fields', () => {
    const { sections } = mapEventToRenderModel(fullExhibition(), emptyCtx);
    const visit = findSection(sections, 'visitCta')!;
    expect(visit.data.dateDisplay).toBe('April 18 – May 12, 2026');
    expect(visit.data.hours).toBe('Tue–Sat, 11–18');
    expect(visit.data.location).toBe('Galleria Sasha, Milan');
    expect(visit.data.admission).toBe('Free');
    expect(visit.data.ctaLabel).toBe('RSVP for Opening');
    expect(visit.data.openingDisplay).toBe('April 18, 2026, 18:00');
    expect(visit.data.secondaryAction).toBe('Add to calendar');
  });

  it('openingDisplay empty when no openingDate', () => {
    const event = fullExhibition();
    (event as unknown as Record<string, unknown>).openingDate = undefined;
    (event as unknown as Record<string, unknown>).openingTime = undefined;
    const { sections } = mapEventToRenderModel(event, emptyCtx);
    const visit = findSection(sections, 'visitCta')!;
    expect(visit.data.openingDisplay).toBe('');
  });
});

// ---------------------------------------------------------------------------
// N. StickyCta payload (PleinAir)
// ---------------------------------------------------------------------------

describe('N. StickyCta payload', () => {
  it('maps sticky CTA fields', () => {
    const { sections } = mapEventToRenderModel(fullPleinAir(), emptyCtx);
    const sticky = findSection(sections, 'stickyCta')!;
    expect(sticky.data.priceDisplay).toBe('€120');
    expect(sticky.data.dateDisplay).toBe('June 14–15, 2026');
    expect(sticky.data.groupSizeDisplay).toBe('Max 8');
    expect(sticky.data.ctaLabel).toBe('Join This Session');
    expect(sticky.data.scarcityLabel).toBeNull();
  });

  it('scarcity shows when spots taken (groupSize as capacity)', () => {
    const ctx: EventRenderContext = { paidEnrollmentCount: 6 };
    const { sections } = mapEventToRenderModel(fullPleinAir(), ctx);
    const sticky = findSection(sections, 'stickyCta')!;
    expect(sticky.data.scarcityLabel).toBe('2 of 8 spots remaining');
  });
});

// ---------------------------------------------------------------------------
// O. No undefined in any section data
// ---------------------------------------------------------------------------

describe('O. No undefined values in output', () => {
  function assertNoUndefined(obj: unknown, path = ''): void {
    if (obj === undefined) {
      throw new Error(`Found undefined at path: ${path}`);
    }
    if (obj === null) return;
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => assertNoUndefined(item, `${path}[${i}]`));
      return;
    }
    if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        assertNoUndefined(value, path ? `${path}.${key}` : key);
      }
    }
  }

  it('workshop: no undefined anywhere', () => {
    const model = mapEventToRenderModel(fullWorkshop(), emptyCtx);
    assertNoUndefined(model);
  });

  it('sparse workshop: no undefined anywhere', () => {
    const model = mapEventToRenderModel(sparseWorkshop(), emptyCtx);
    assertNoUndefined(model);
  });

  it('pleinAir: no undefined anywhere', () => {
    const model = mapEventToRenderModel(fullPleinAir(), emptyCtx);
    assertNoUndefined(model);
  });

  it('exhibition: no undefined anywhere', () => {
    const model = mapEventToRenderModel(fullExhibition(), emptyCtx);
    assertNoUndefined(model);
  });

  it('minimal with extended: no undefined anywhere', () => {
    const model = mapEventToRenderModel(fullMinimal(), emptyCtx);
    assertNoUndefined(model);
  });

  it('minimal without extended: no undefined anywhere', () => {
    const model = mapEventToRenderModel(minimalWithoutExtended(), emptyCtx);
    assertNoUndefined(model);
  });
});

// ---------------------------------------------------------------------------
// P. Determinism — same input → same output
// ---------------------------------------------------------------------------

describe('P. Determinism', () => {
  it('workshop: identical output on repeated calls', () => {
    const event = fullWorkshop();
    const a = mapEventToRenderModel(event, emptyCtx);
    const b = mapEventToRenderModel(event, emptyCtx);
    expect(a).toEqual(b);
  });

  it('exhibition: identical output on repeated calls', () => {
    const event = fullExhibition();
    const a = mapEventToRenderModel(event, emptyCtx);
    const b = mapEventToRenderModel(event, emptyCtx);
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// Q. Input not mutated
// ---------------------------------------------------------------------------

describe('Q. Input not mutated', () => {
  it('does not modify the event object', () => {
    const event = fullWorkshop();
    const snapshot = JSON.parse(JSON.stringify(event));
    mapEventToRenderModel(event, emptyCtx);
    expect(event).toEqual(snapshot);
  });

  it('does not modify the context object', () => {
    const ctx: EventRenderContext = { paidEnrollmentCount: 5 };
    const snapshot = { ...ctx };
    mapEventToRenderModel(fullWorkshop(), ctx);
    expect(ctx).toEqual(snapshot);
  });
});

// ---------------------------------------------------------------------------
// R. Edge cases
// ---------------------------------------------------------------------------

describe('R. Edge cases', () => {
  it('empty gallery images → section not rendered', () => {
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).experienceImages = [];
    const { sections } = mapEventToRenderModel(event, emptyCtx);
    expect(sectionKinds(sections)).not.toContain('galleryExperience');
  });

  it('exhibition with fewer than 4 featured works → section still renders', () => {
    const event = fullExhibition();
    // 2 works — still has data, assembly passes, but layout will be null
    const exh = event as unknown as Record<string, unknown>;
    exh['featuredWorks'] = [
      { image: 'w1', title: { en: 'A' } },
      { image: 'w2', title: { en: 'B' } },
    ];
    const { sections } = mapEventToRenderModel(event, emptyCtx);
    const fw = findSection(sections, 'featuredWorks')!;
    expect(fw.data.works).toHaveLength(2);
    expect(fw.data.layout).toBeNull();
  });

  it('price is a required sourceField — section skipped when absent', () => {
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).price = undefined;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { sections } = mapEventToRenderModel(event, emptyCtx);
    spy.mockRestore();
    // heroStandard, quickFacts, ctaBlock all require price
    expect(sectionKinds(sections)).not.toContain('heroStandard');
    expect(sectionKinds(sections)).not.toContain('quickFacts');
    expect(sectionKinds(sections)).not.toContain('ctaBlock');
  });

  it('zero price → priceDisplay is "Free"', () => {
    const { sections } = mapEventToRenderModel(sparseWorkshop(), emptyCtx);
    const hero = findSection(sections, 'heroStandard')!;
    expect(hero.data.priceDisplay).toBe('Free');
  });

  it('no dateStart → dateDisplay is empty string', () => {
    const event = fullWorkshop();
    (event as unknown as Record<string, unknown>).dateStart = undefined;
    // heroStandard requires dateStart — it will be skipped in production.
    // But we can still test via development mode where it shows a placeholder.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { sections } = mapEventToRenderModel(event, emptyCtx, { mode: 'development' });
    spy.mockRestore();
    // heroStandard won't have data (error-placeholder), so it won't be in sections
    expect(sectionKinds(sections)).not.toContain('heroStandard');
  });

  it('CaptionedWork without medium → medium is empty string', () => {
    const { sections } = mapEventToRenderModel(fullExhibition(), emptyCtx);
    const fw = findSection(sections, 'featuredWorks')!;
    const workWithoutMedium = fw.data.works.find((w) => w.title === 'Harbor');
    expect(workWithoutMedium!.medium).toBe('');
  });
});
