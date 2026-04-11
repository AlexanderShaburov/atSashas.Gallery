// features/public/eventPage/EventPageView.tsx
// Stage 5B+5C: top-level event page renderer with layout integration.
// Consumes RenderEventPageModel from Stage 5A.
// Assigns layout category classes per section for width/spacing control.
// StickyCtaSection is separated into its own container for fixed positioning.

import './EventPage.css';

import type { RenderEventPageModel, RenderEventSection } from './renderModel.types';
import { renderEventSection } from './renderEventSection';

// ---------------------------------------------------------------------------
// Layout categories — each section kind maps to a width/spacing category.
// Categories control max-width, horizontal padding, and vertical rhythm.
// ---------------------------------------------------------------------------

type LayoutCategory = 'full-bleed' | 'wide' | 'content' | 'narrow' | 'compact';

const SECTION_LAYOUT: Record<RenderEventSection['kind'], LayoutCategory> = {
  heroStandard: 'full-bleed',
  heroCinematic: 'full-bleed',
  heroEditorial: 'full-bleed',
  heroCard: 'content',
  bridge: 'narrow',
  quickFacts: 'content',
  description: 'narrow',
  hostNote: 'narrow',
  galleryExperience: 'wide',
  galleryResults: 'wide',
  featuredWorks: 'wide',
  ctaBlock: 'compact',
  visitCta: 'content',
  stickyCta: 'full-bleed',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  model: RenderEventPageModel;
  onCtaClick?: () => void;
};

export function EventPageView({ model, onCtaClick }: Props) {
  const mainSections = model.sections.filter((s) => s.kind !== 'stickyCta');
  const stickyCta = model.sections.find((s) => s.kind === 'stickyCta');
  const opts = onCtaClick ? { onCtaClick } : undefined;

  return (
    <article className="ep-page" data-preset={model.preset}>
      {mainSections.map((section, i) => (
        <div
          key={`${section.kind}-${i}`}
          className={`ep-page__section ep-layout--${SECTION_LAYOUT[section.kind]}`}
          data-section-kind={section.kind}
        >
          {renderEventSection(section, opts)}
        </div>
      ))}
      {stickyCta && (
        <div className="ep-page__sticky">
          {renderEventSection(stickyCta, opts)}
        </div>
      )}
    </article>
  );
}

export { SECTION_LAYOUT };
