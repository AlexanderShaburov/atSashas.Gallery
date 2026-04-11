import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createEventPage } from '@/entities/event/eventFactory';
import { resolveEventDefaults } from '@/entities/event/resolveEventDefaults';
import type { EventRenderContext } from '@/entities/event/eventRenderContext';
import type {
  ExhibitionEventPage,
  MinimalEventPage,
  PleinAirEventPage,
  WorkshopEventPage,
} from '@/entities/event/eventPage.types';

import { mapEventToRenderModel } from '../mapEventToRenderModel';
import { renderEventSection } from '../renderEventSection';
import { EventPageView, SECTION_LAYOUT } from '../EventPageView';
import type { RenderEventPageModel, RenderEventSection } from '../renderModel.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const emptyCtx: EventRenderContext = { paidEnrollmentCount: 0 };

function render(model: RenderEventPageModel): string {
  return renderToString(createElement(EventPageView, { model }));
}

function renderSection(section: RenderEventSection): string {
  return renderToString(renderEventSection(section) as any);
}

function dataSectionValues(html: string): string[] {
  const matches = html.matchAll(/data-section="([^"]+)"/g);
  return [...matches].map((m) => m[1]!);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fullWorkshopModel(): RenderEventPageModel {
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
  return mapEventToRenderModel(resolveEventDefaults(raw), emptyCtx);
}

function fullPleinAirModel(): RenderEventPageModel {
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
  return mapEventToRenderModel(resolveEventDefaults(raw), emptyCtx);
}

function fullExhibitionModel(): RenderEventPageModel {
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
  raw.hours = { en: 'Tue–Sat, 11–18' };
  raw.location = { en: 'Galleria Sasha, Milan' };
  raw.admission = { en: 'Free' };
  raw.ctaLabel = { en: 'RSVP for Opening' };
  raw.openingDate = '2026-04-18';
  raw.openingTime = '18:00';
  return mapEventToRenderModel(resolveEventDefaults(raw), emptyCtx);
}

function fullMinimalModel(): RenderEventPageModel {
  const raw = createEventPage('minimal') as MinimalEventPage;
  raw.title = { en: 'Open Studio Night' };
  raw.description = { en: 'Drawing, music, conversation.' };
  raw.dateStart = '2026-04-25';
  raw.location = { en: 'Studio 12' };
  raw.ctaLabel = { en: 'RSVP' };
  raw.heroImage = 'hero-min-1';
  (raw as unknown as Record<string, unknown>).extendedDescription = {
    en: 'Easels and paper provided.',
  };
  return mapEventToRenderModel(resolveEventDefaults(raw), emptyCtx);
}

// ---------------------------------------------------------------------------
// A. Dispatcher covers all section kinds
// ---------------------------------------------------------------------------

describe('A. Dispatcher covers all section kinds', () => {
  const ALL_SECTION_KINDS: RenderEventSection['kind'][] = [
    'heroStandard',
    'heroCinematic',
    'heroEditorial',
    'heroCard',
    'bridge',
    'quickFacts',
    'description',
    'hostNote',
    'galleryExperience',
    'galleryResults',
    'featuredWorks',
    'ctaBlock',
    'visitCta',
    'stickyCta',
  ];

  it('every section kind renders without throwing', () => {
    // Collect all sections from all presets
    const allModels = [
      fullWorkshopModel(),
      fullPleinAirModel(),
      fullExhibitionModel(),
      fullMinimalModel(),
    ];
    const renderedKinds = new Set<string>();

    for (const model of allModels) {
      for (const section of model.sections) {
        expect(() => renderSection(section)).not.toThrow();
        renderedKinds.add(section.kind);
      }
    }

    // Verify all kinds were exercised
    for (const kind of ALL_SECTION_KINDS) {
      expect(renderedKinds.has(kind)).toBe(true);
    }
  });

  it('each section produces HTML with matching data-section attribute', () => {
    const allModels = [
      fullWorkshopModel(),
      fullPleinAirModel(),
      fullExhibitionModel(),
      fullMinimalModel(),
    ];

    for (const model of allModels) {
      for (const section of model.sections) {
        const html = renderSection(section);
        expect(html).toContain(`data-section="${section.kind}"`);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// B. Render order matches model.sections
// ---------------------------------------------------------------------------

describe('B. Render order matches model.sections', () => {
  it('workshop: sections appear in model order', () => {
    const model = fullWorkshopModel();
    const html = render(model);
    const rendered = dataSectionValues(html);
    expect(rendered).toEqual([
      'heroStandard',
      'quickFacts',
      'description',
      'hostNote',
      'galleryExperience',
      'galleryResults',
      'ctaBlock',
    ]);
  });

  it('pleinAir: sections appear in model order (stickyCta last)', () => {
    const model = fullPleinAirModel();
    const html = render(model);
    const rendered = dataSectionValues(html);
    // stickyCta is separated but still in DOM after main sections
    expect(rendered).toEqual([
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

  it('exhibition: sections appear in model order', () => {
    const model = fullExhibitionModel();
    const html = render(model);
    const rendered = dataSectionValues(html);
    expect(rendered).toEqual([
      'heroEditorial',
      'description',
      'featuredWorks',
      'hostNote',
      'visitCta',
    ]);
  });

  it('minimal: sections appear in model order', () => {
    const model = fullMinimalModel();
    const html = render(model);
    const rendered = dataSectionValues(html);
    expect(rendered).toEqual(['heroCard', 'description']);
  });
});

// ---------------------------------------------------------------------------
// C. Payload data appears in rendered output
// ---------------------------------------------------------------------------

describe('C. Section payloads reach components', () => {
  it('heroStandard: title, subtitle, price, date appear', () => {
    const model = fullWorkshopModel();
    const html = render(model);
    expect(html).toContain('Watercolor Foundations');
    expect(html).toContain('A beginner workshop');
    expect(html).toContain('€45');
    expect(html).toContain('May 17, 2026');
  });

  it('heroCinematic: eyebrow, title, subtitle appear', () => {
    const model = fullPleinAirModel();
    const html = render(model);
    expect(html).toContain('Plein Air Session');
    expect(html).toContain('Ligurian Coast');
    expect(html).toContain('Two mornings painting the coast');
  });

  it('heroEditorial: eyebrow, title, date range appear', () => {
    const model = fullExhibitionModel();
    const html = render(model);
    expect(html).toContain('Exhibition');
    expect(html).toContain('Between Memory and Place');
    expect(html).toContain('April 18');
  });

  it('heroCard: title, description, location, CTA appear', () => {
    const model = fullMinimalModel();
    const html = render(model);
    expect(html).toContain('Open Studio Night');
    expect(html).toContain('Drawing, music, conversation.');
    expect(html).toContain('Studio 12');
    expect(html).toContain('RSVP');
  });

  it('bridge: text appears', () => {
    const model = fullPleinAirModel();
    const html = render(model);
    expect(html).toContain('Paint where the light is.');
  });

  it('quickFacts: fact labels and values appear', () => {
    const model = fullWorkshopModel();
    const html = render(model);
    expect(html).toContain('3 hours');
    expect(html).toContain('Studio 12, Milan');
  });

  it('description: text content appears', () => {
    const model = fullWorkshopModel();
    const html = render(model);
    expect(html).toContain('Learn watercolor fundamentals.');
  });

  it('description: exhibition splits thesis and body', () => {
    const model = fullExhibitionModel();
    const html = render(model);
    expect(html).toContain('Twelve works exploring memory.');
    expect(html).toContain('The body continues here.');
    expect(html).toContain('About the Exhibition');
  });

  it('hostNote: label, note, attribution appear', () => {
    const model = fullWorkshopModel();
    const html = render(model);
    expect(html).toContain('A note from the host');
    expect(html).toContain('No experience needed.');
    expect(html).toContain('Sasha');
  });

  it('galleryExperience: title and images appear', () => {
    const model = fullWorkshopModel();
    const html = render(model);
    expect(html).toContain('The Workshop Experience');
    expect(html).toContain('exp-1');
    expect(html).toContain('exp-2');
    expect(html).toContain('exp-3');
  });

  it('galleryResults: title and images appear', () => {
    const model = fullWorkshopModel();
    const html = render(model);
    expect(html).toContain('Participant Results');
    expect(html).toContain('res-1');
    expect(html).toContain('res-2');
  });

  it('featuredWorks: title and work titles appear', () => {
    const model = fullExhibitionModel();
    const html = render(model);
    expect(html).toContain('Selected Works');
    expect(html).toContain('Morning Light');
    expect(html).toContain('Oil on canvas');
    expect(html).toContain('Harbor');
  });

  it('ctaBlock: bridge, meta line, CTA label appear', () => {
    const model = fullWorkshopModel();
    const html = render(model);
    expect(html).toContain('You will leave with a finished piece.');
    expect(html).toContain('Reserve Your Spot');
    expect(html).toContain('May 17, 2026');
  });

  it('visitCta: dates, hours, location, admission appear', () => {
    const model = fullExhibitionModel();
    const html = render(model);
    expect(html).toContain('Tue–Sat, 11–18');
    expect(html).toContain('Galleria Sasha, Milan');
    expect(html).toContain('Free');
    expect(html).toContain('RSVP for Opening');
    expect(html).toContain('Add to calendar');
  });

  it('stickyCta: price, date, group size, CTA appear', () => {
    const model = fullPleinAirModel();
    const html = render(model);
    expect(html).toContain('€120');
    expect(html).toContain('June 14–15, 2026');
    expect(html).toContain('Max 8');
    expect(html).toContain('Join This Session');
  });
});

// ---------------------------------------------------------------------------
// D. Page-level composition is minimal
// ---------------------------------------------------------------------------

describe('D. Page-level composition', () => {
  it('page renders data-preset attribute', () => {
    const html = render(fullWorkshopModel());
    expect(html).toContain('data-preset="workshop"');
  });

  it('page renders article element', () => {
    const html = render(fullWorkshopModel());
    expect(html).toContain('<article');
  });

  it('page has ep-page class', () => {
    const html = render(fullWorkshopModel());
    expect(html).toContain('class="ep-page"');
  });
});

// ---------------------------------------------------------------------------
// E. Empty sections array renders safely
// ---------------------------------------------------------------------------

describe('E. Empty sections', () => {
  it('renders an empty page with no sections', () => {
    const model: RenderEventPageModel = { preset: 'workshop', sections: [] };
    const html = render(model);
    expect(html).toContain('data-preset="workshop"');
    expect(dataSectionValues(html)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// F. StickyCta is handled separately
// ---------------------------------------------------------------------------

describe('F. StickyCta handling', () => {
  it('stickyCta is rendered in a separate sticky container', () => {
    const model = fullPleinAirModel();
    const html = render(model);
    // stickyCta is inside ep-page__sticky wrapper
    expect(html).toContain('ep-page__sticky');
    // stickyCta data-section is still present
    expect(html).toContain('data-section="stickyCta"');
  });

  it('stickyCta is not inside the main section flow', () => {
    const model = fullPleinAirModel();
    const html = render(model);
    // Verify stickyCta appears after the last main section wrapper
    const lastMainSectionEnd = html.lastIndexOf('ep-page__section');
    const stickyStart = html.indexOf('ep-page__sticky');
    expect(stickyStart).toBeGreaterThan(lastMainSectionEnd);
  });

  it('presets without stickyCta have no sticky container', () => {
    const model = fullWorkshopModel();
    const html = render(model);
    expect(html).not.toContain('ep-page__sticky');
  });

  it('stickyCta has role="complementary"', () => {
    const model = fullPleinAirModel();
    const html = render(model);
    expect(html).toContain('role="complementary"');
  });
});

// ---------------------------------------------------------------------------
// G. Determinism
// ---------------------------------------------------------------------------

describe('G. Determinism', () => {
  it('same model → same HTML', () => {
    const model = fullWorkshopModel();
    const a = render(model);
    const b = render(model);
    expect(a).toBe(b);
  });
});

// ---------------------------------------------------------------------------
// H. Layout category system (Stage 5C)
// ---------------------------------------------------------------------------

describe('H. Layout categories', () => {
  const ALL_SECTION_KINDS: RenderEventSection['kind'][] = [
    'heroStandard', 'heroCinematic', 'heroEditorial', 'heroCard',
    'bridge', 'quickFacts', 'description', 'hostNote',
    'galleryExperience', 'galleryResults', 'featuredWorks',
    'ctaBlock', 'visitCta', 'stickyCta',
  ];

  it('SECTION_LAYOUT covers all section kinds', () => {
    for (const kind of ALL_SECTION_KINDS) {
      expect(SECTION_LAYOUT[kind]).toBeDefined();
      expect(['full-bleed', 'wide', 'content', 'narrow', 'compact']).toContain(
        SECTION_LAYOUT[kind],
      );
    }
  });

  it('workshop sections have correct layout classes in HTML', () => {
    const model = fullWorkshopModel();
    const html = render(model);
    expect(html).toContain('ep-layout--full-bleed');  // heroStandard
    expect(html).toContain('ep-layout--content');      // quickFacts
    expect(html).toContain('ep-layout--narrow');        // description, hostNote
    expect(html).toContain('ep-layout--wide');          // galleries
    expect(html).toContain('ep-layout--compact');       // ctaBlock
  });

  it('each section wrapper has data-section-kind attribute', () => {
    const model = fullWorkshopModel();
    const html = render(model);
    expect(html).toContain('data-section-kind="heroStandard"');
    expect(html).toContain('data-section-kind="quickFacts"');
    expect(html).toContain('data-section-kind="description"');
    expect(html).toContain('data-section-kind="ctaBlock"');
  });

  it('hero sections are full-bleed', () => {
    expect(SECTION_LAYOUT['heroStandard']).toBe('full-bleed');
    expect(SECTION_LAYOUT['heroCinematic']).toBe('full-bleed');
    expect(SECTION_LAYOUT['heroEditorial']).toBe('full-bleed');
  });

  it('gallery sections are wide', () => {
    expect(SECTION_LAYOUT['galleryExperience']).toBe('wide');
    expect(SECTION_LAYOUT['galleryResults']).toBe('wide');
    expect(SECTION_LAYOUT['featuredWorks']).toBe('wide');
  });

  it('text sections are narrow', () => {
    expect(SECTION_LAYOUT['description']).toBe('narrow');
    expect(SECTION_LAYOUT['hostNote']).toBe('narrow');
    expect(SECTION_LAYOUT['bridge']).toBe('narrow');
  });

  it('CTA block is compact', () => {
    expect(SECTION_LAYOUT['ctaBlock']).toBe('compact');
  });
});

// ---------------------------------------------------------------------------
// I. Layout stability across page configurations
// ---------------------------------------------------------------------------

describe('I. Layout stability', () => {
  it('hero + CTA only (minimal sections)', () => {
    const model: RenderEventPageModel = {
      preset: 'workshop',
      sections: [
        {
          kind: 'heroStandard',
          data: {
            title: 'Title', subtitle: 'Sub', heroImage: null,
            priceDisplay: 'Free', dateDisplay: 'Jan 1, 2026',
          },
        },
        {
          kind: 'ctaBlock',
          data: {
            bridgeText: 'Go', ctaLabel: 'Click', metaLine: '',
            scarcityLabel: null, cancellationNote: '',
          },
        },
      ],
    };
    const html = render(model);
    const sections = dataSectionValues(html);
    expect(sections).toEqual(['heroStandard', 'ctaBlock']);
    expect(html).toContain('ep-layout--full-bleed');
    expect(html).toContain('ep-layout--compact');
  });

  it('hero + bridge + description (text-heavy page)', () => {
    const model: RenderEventPageModel = {
      preset: 'pleinAir',
      sections: [
        {
          kind: 'heroCinematic',
          data: { title: 'Coast', subtitle: 'Paint', heroImage: 'img', eyebrow: 'PA' },
        },
        { kind: 'bridge', data: { text: 'A bridge line.' } },
        {
          kind: 'description',
          data: { label: '', text: 'Full text', thesisLine: 'Full text', bodyParagraphs: '' },
        },
      ],
    };
    const html = render(model);
    const sections = dataSectionValues(html);
    expect(sections).toEqual(['heroCinematic', 'bridge', 'description']);
    expect(html).toContain('ep-layout--narrow'); // bridge + description
    expect(html).toContain('ep-layout--full-bleed'); // hero
  });

  it('image-heavy page (workshop with galleries)', () => {
    const model = fullWorkshopModel();
    const html = render(model);
    // Should have wide layout for galleries
    const wideCount = (html.match(/ep-layout--wide/g) ?? []).length;
    expect(wideCount).toBe(2); // galleryExperience + galleryResults
  });

  it('minimal event page renders cleanly', () => {
    const model = fullMinimalModel();
    const html = render(model);
    const sections = dataSectionValues(html);
    expect(sections).toEqual(['heroCard', 'description']);
    expect(html).not.toContain('ep-page__sticky');
  });

  it('plein air with sticky CTA renders both main flow and sticky', () => {
    const model = fullPleinAirModel();
    const html = render(model);
    // Main sections should NOT include stickyCta layout wrapper
    const sectionKindAttrs = [...html.matchAll(/data-section-kind="([^"]+)"/g)].map(m => m[1]);
    expect(sectionKindAttrs).not.toContain('stickyCta');
    // But stickyCta should still be in the page (in ep-page__sticky)
    expect(html).toContain('data-section="stickyCta"');
  });
});
