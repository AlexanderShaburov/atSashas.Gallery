// features/public/eventPage/renderEventSection.tsx
// Stage 5B: centralized section dispatcher.
// Exhaustive switch — compile-time failure if a new section kind is added without a renderer.

import type { ReactNode } from 'react';

import type { RenderEventSection } from './renderModel.types';
import {
  BridgeSection,
  CtaBlockSection,
  DescriptionSection,
  FeaturedWorksSection,
  GalleryExperienceSection,
  GalleryResultsSection,
  HeroCardSection,
  HeroCinematicSection,
  HeroEditorialSection,
  HeroStandardSection,
  HostNoteSection,
  QuickFactsSection,
  StickyCtaSection,
  VisitCtaSection,
} from './sections';

export interface RenderSectionOptions {
  onCtaClick?: () => void;
}

/**
 * Maps a single RenderEventSection to its corresponding React component.
 * Exhaustive: adding a new section kind without handling it here causes a compile error.
 */
export function renderEventSection(section: RenderEventSection, options?: RenderSectionOptions): ReactNode {
  const onCtaClick = options?.onCtaClick;
  switch (section.kind) {
    case 'heroStandard':
      return <HeroStandardSection data={section.data} />;
    case 'heroCinematic':
      return <HeroCinematicSection data={section.data} />;
    case 'heroEditorial':
      return <HeroEditorialSection data={section.data} />;
    case 'heroCard':
      return <HeroCardSection data={section.data} onCtaClick={onCtaClick} />;
    case 'bridge':
      return <BridgeSection data={section.data} />;
    case 'quickFacts':
      return <QuickFactsSection data={section.data} />;
    case 'description':
      return <DescriptionSection data={section.data} />;
    case 'hostNote':
      return <HostNoteSection data={section.data} />;
    case 'galleryExperience':
      return <GalleryExperienceSection data={section.data} />;
    case 'galleryResults':
      return <GalleryResultsSection data={section.data} />;
    case 'featuredWorks':
      return <FeaturedWorksSection data={section.data} />;
    case 'ctaBlock':
      return <CtaBlockSection data={section.data} onCtaClick={onCtaClick} />;
    case 'visitCta':
      return <VisitCtaSection data={section.data} onCtaClick={onCtaClick} />;
    case 'stickyCta':
      return <StickyCtaSection data={section.data} onCtaClick={onCtaClick} />;
    default: {
      const _exhaustive: never = section;
      throw new Error(`Unknown section kind: ${(_exhaustive as { kind: string }).kind}`);
    }
  }
}
