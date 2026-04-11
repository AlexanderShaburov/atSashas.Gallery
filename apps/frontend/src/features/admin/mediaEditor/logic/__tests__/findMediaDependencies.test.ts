import { describe, expect, it } from 'vitest';

import type { Block, ComposableBlock, GalleryBlock, TextBlock } from '@/entities/block/block.types';
import type { EventPageData } from '@/entities/event/eventPage.types';
import { findMediaDependencies } from '../findMediaDependencies';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MEDIA_ID = 'media-20260401-target';
const OTHER_ID = 'media-20260401-other';

function composableBlock(id: string, mediaIds: string[]): ComposableBlock {
  return {
    id,
    blockKind: 'composable',
    lifecycle: 'draft',
    dateCreated: '2026-04-01',
    layout: 'single',
    caption: { en: `Block ${id}` },
    slots: mediaIds.map((mid, i) => ({
      position: 'Center' as const,
      content: { kind: 'media' as const, mediaId: mid },
      caption: { en: `slot-${i}` },
    })),
  };
}

function galleryBlock(id: string): GalleryBlock {
  return {
    id,
    blockKind: 'gallery',
    lifecycle: 'draft',
    dateCreated: '2026-04-01',
    layout: 'single',
    items: [{ kind: 'art', artId: 'art-1', position: 'Center' }],
  };
}

function textBlock(id: string): TextBlock {
  return {
    id,
    blockKind: 'text',
    lifecycle: 'draft',
    dateCreated: '2026-04-01',
    body: { en: 'hello' },
  };
}

// ---------------------------------------------------------------------------
// Block tests
// ---------------------------------------------------------------------------

describe('findMediaDependencies — blocks', () => {
  it('finds media references in composable block slots', () => {
    const blocks: Record<string, Block> = {
      b1: composableBlock('b1', [MEDIA_ID]),
    };
    const deps = findMediaDependencies(MEDIA_ID, blocks, {});
    expect(deps).toEqual([
      { entityKind: 'block', entityId: 'b1', entityTitle: 'Block b1', field: 'slots' },
    ]);
  });

  it('ignores composable slots with different mediaId', () => {
    const blocks: Record<string, Block> = {
      b1: composableBlock('b1', [OTHER_ID]),
    };
    expect(findMediaDependencies(MEDIA_ID, blocks, {})).toEqual([]);
  });

  it('finds multiple slot references in same block (reported once per slot)', () => {
    const blocks: Record<string, Block> = {
      b1: composableBlock('b1', [MEDIA_ID, OTHER_ID, MEDIA_ID]),
    };
    const deps = findMediaDependencies(MEDIA_ID, blocks, {});
    expect(deps).toHaveLength(2);
    expect(deps.every((d) => d.entityId === 'b1')).toBe(true);
  });

  it('ignores gallery and text blocks', () => {
    const blocks: Record<string, Block> = {
      g1: galleryBlock('g1'),
      t1: textBlock('t1'),
    };
    expect(findMediaDependencies(MEDIA_ID, blocks, {})).toEqual([]);
  });

  it('finds references across multiple blocks', () => {
    const blocks: Record<string, Block> = {
      b1: composableBlock('b1', [MEDIA_ID]),
      b2: composableBlock('b2', [OTHER_ID]),
      b3: composableBlock('b3', [MEDIA_ID]),
    };
    const deps = findMediaDependencies(MEDIA_ID, blocks, {});
    expect(deps).toHaveLength(2);
    expect(deps.map((d) => d.entityId)).toEqual(['b1', 'b3']);
  });

  it('falls back to id-based title when block has no caption', () => {
    const block: ComposableBlock = {
      id: 'b-no-cap',
      blockKind: 'composable',
      lifecycle: 'draft',
      dateCreated: '2026-04-01',
      layout: 'single',
      slots: [{ position: 'Center', content: { kind: 'media', mediaId: MEDIA_ID } }],
    };
    const deps = findMediaDependencies(MEDIA_ID, { 'b-no-cap': block }, {});
    expect(deps[0]!.entityTitle).toBe('Composable block b-no-cap');
  });
});

// ---------------------------------------------------------------------------
// Event page tests
// ---------------------------------------------------------------------------

describe('findMediaDependencies — event pages', () => {
  it('finds heroImage reference (workshop)', () => {
    const pages: Record<string, EventPageData> = {
      e1: {
        id: 'e1',
        slug: 'workshop-1',
        preset: 'workshop',
        status: 'draft',
        title: { en: 'My Workshop' },
        subtitle: { en: 'S' },
        heroImage: MEDIA_ID,
        description: { en: 'D' },
        location: { en: 'L' },
        ctaLabel: { en: 'CTA' },
        ctaBridge: { en: 'B' },
      },
    };
    const deps = findMediaDependencies(MEDIA_ID, {}, pages);
    expect(deps).toEqual([
      { entityKind: 'eventPage', entityId: 'e1', entityTitle: 'My Workshop', field: 'heroImage' },
    ]);
  });

  it('finds experienceImages reference (pleinAir)', () => {
    const pages: Record<string, EventPageData> = {
      e1: {
        id: 'e1',
        slug: 'plein-1',
        preset: 'pleinAir',
        status: 'draft',
        title: { en: 'Plein Air' },
        subtitle: { en: 'S' },
        description: { en: 'D' },
        location: { en: 'L' },
        ctaLabel: { en: 'CTA' },
        ctaBridge: { en: 'B' },
        experienceImages: [OTHER_ID, MEDIA_ID],
      },
    };
    const deps = findMediaDependencies(MEDIA_ID, {}, pages);
    expect(deps).toEqual([
      { entityKind: 'eventPage', entityId: 'e1', entityTitle: 'Plein Air', field: 'experienceImages' },
    ]);
  });

  it('finds resultsImages reference (workshop)', () => {
    const pages: Record<string, EventPageData> = {
      e1: {
        id: 'e1',
        slug: 'w-2',
        preset: 'workshop',
        status: 'draft',
        title: { en: 'W' },
        subtitle: { en: 'S' },
        description: { en: 'D' },
        location: { en: 'L' },
        ctaLabel: { en: 'CTA' },
        ctaBridge: { en: 'B' },
        resultsImages: [MEDIA_ID],
      },
    };
    const deps = findMediaDependencies(MEDIA_ID, {}, pages);
    expect(deps).toEqual([
      { entityKind: 'eventPage', entityId: 'e1', entityTitle: 'W', field: 'resultsImages' },
    ]);
  });

  it('finds featuredWorks reference (exhibition)', () => {
    const pages: Record<string, EventPageData> = {
      e1: {
        id: 'e1',
        slug: 'exh-1',
        preset: 'exhibition',
        status: 'draft',
        title: { en: 'Exhibition' },
        description: { en: 'D' },
        location: { en: 'L' },
        ctaLabel: { en: 'CTA' },
        featuredWorks: [
          { image: OTHER_ID, title: { en: 'Other' } },
          { image: MEDIA_ID, title: { en: 'Target' } },
        ],
      },
    };
    const deps = findMediaDependencies(MEDIA_ID, {}, pages);
    expect(deps).toEqual([
      { entityKind: 'eventPage', entityId: 'e1', entityTitle: 'Exhibition', field: 'featuredWorks' },
    ]);
  });

  it('finds heroImage reference (minimal)', () => {
    const pages: Record<string, EventPageData> = {
      e1: {
        id: 'e1',
        slug: 'min-1',
        preset: 'minimal',
        status: 'draft',
        title: { en: 'Minimal' },
        description: { en: 'D' },
        location: { en: 'L' },
        ctaLabel: { en: 'CTA' },
        heroImage: MEDIA_ID,
      },
    };
    const deps = findMediaDependencies(MEDIA_ID, {}, pages);
    expect(deps).toEqual([
      { entityKind: 'eventPage', entityId: 'e1', entityTitle: 'Minimal', field: 'heroImage' },
    ]);
  });

  it('reports multiple fields from same page', () => {
    const pages: Record<string, EventPageData> = {
      e1: {
        id: 'e1',
        slug: 'w-3',
        preset: 'workshop',
        status: 'draft',
        title: { en: 'W' },
        subtitle: { en: 'S' },
        description: { en: 'D' },
        location: { en: 'L' },
        ctaLabel: { en: 'CTA' },
        ctaBridge: { en: 'B' },
        heroImage: MEDIA_ID,
        experienceImages: [MEDIA_ID],
        resultsImages: [MEDIA_ID],
      },
    };
    const deps = findMediaDependencies(MEDIA_ID, {}, pages);
    expect(deps).toHaveLength(3);
    expect(deps.map((d) => d.field)).toEqual(['heroImage', 'experienceImages', 'resultsImages']);
  });

  it('ignores pages with no matching references', () => {
    const pages: Record<string, EventPageData> = {
      e1: {
        id: 'e1',
        slug: 'w-4',
        preset: 'workshop',
        status: 'draft',
        title: { en: 'W' },
        subtitle: { en: 'S' },
        description: { en: 'D' },
        location: { en: 'L' },
        ctaLabel: { en: 'CTA' },
        ctaBridge: { en: 'B' },
        heroImage: OTHER_ID,
      },
    };
    expect(findMediaDependencies(MEDIA_ID, {}, pages)).toEqual([]);
  });

  it('falls back to slug when title has no en locale', () => {
    const pages: Record<string, EventPageData> = {
      e1: {
        id: 'e1',
        slug: 'fallback-slug',
        preset: 'minimal',
        status: 'draft',
        title: { ru: 'Russian' },
        description: { en: 'D' },
        location: { en: 'L' },
        ctaLabel: { en: 'CTA' },
        heroImage: MEDIA_ID,
      },
    };
    const deps = findMediaDependencies(MEDIA_ID, {}, pages);
    expect(deps[0]!.entityTitle).toBe('fallback-slug');
  });
});

// ---------------------------------------------------------------------------
// Combined
// ---------------------------------------------------------------------------

describe('findMediaDependencies — combined', () => {
  it('finds dependencies across blocks and event pages', () => {
    const blocks: Record<string, Block> = {
      b1: composableBlock('b1', [MEDIA_ID]),
    };
    const pages: Record<string, EventPageData> = {
      e1: {
        id: 'e1',
        slug: 'min-2',
        preset: 'minimal',
        status: 'draft',
        title: { en: 'M' },
        description: { en: 'D' },
        location: { en: 'L' },
        ctaLabel: { en: 'CTA' },
        heroImage: MEDIA_ID,
      },
    };
    const deps = findMediaDependencies(MEDIA_ID, blocks, pages);
    expect(deps).toHaveLength(2);
    expect(deps[0]!.entityKind).toBe('block');
    expect(deps[1]!.entityKind).toBe('eventPage');
  });

  it('returns empty when no references exist', () => {
    const blocks: Record<string, Block> = {
      g1: galleryBlock('g1'),
    };
    const pages: Record<string, EventPageData> = {};
    expect(findMediaDependencies(MEDIA_ID, blocks, pages)).toEqual([]);
  });
});
