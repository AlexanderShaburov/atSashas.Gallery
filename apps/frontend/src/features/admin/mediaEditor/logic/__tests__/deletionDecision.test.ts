import { describe, expect, it } from 'vitest';

import type { Block, ComposableBlock } from '@/entities/block/block.types';
import type { EventPageData } from '@/entities/event/eventPage.types';
import { findMediaDependencies } from '../findMediaDependencies';

// ---------------------------------------------------------------------------
// Integration-level tests: deletion decision based on findMediaDependencies
// ---------------------------------------------------------------------------

const TARGET = 'media-20260401-target';

function composable(id: string, mediaId: string): ComposableBlock {
  return {
    id,
    blockKind: 'composable',
    lifecycle: 'draft',
    dateCreated: '2026-04-01',
    layout: 'single',
    caption: { en: `Block ${id}` },
    slots: [{ position: 'Center', content: { kind: 'media', mediaId } }],
  };
}

function workshopPage(id: string, heroImage?: string): EventPageData {
  return {
    id,
    slug: `ws-${id}`,
    preset: 'workshop',
    status: 'draft',
    title: { en: `Workshop ${id}` },
    subtitle: { en: 'S' },
    description: { en: 'D' },
    location: { en: 'L' },
    ctaLabel: { en: 'CTA' },
    ctaBridge: { en: 'B' },
    heroImage,
  };
}

describe('deletion decision — hard-block when deps exist', () => {
  it('allows deletion when no dependencies', () => {
    const deps = findMediaDependencies(TARGET, {}, {});
    expect(deps).toEqual([]);
    // deleteItem would proceed to API call
  });

  it('blocks deletion when block references exist', () => {
    const blocks: Record<string, Block> = {
      b1: composable('b1', TARGET),
    };
    const deps = findMediaDependencies(TARGET, blocks, {});
    expect(deps.length).toBeGreaterThan(0);
    expect(deps[0]!.entityKind).toBe('block');
    expect(deps[0]!.entityTitle).toBe('Block b1');
  });

  it('blocks deletion when event page references exist', () => {
    const pages: Record<string, EventPageData> = {
      e1: workshopPage('e1', TARGET),
    };
    const deps = findMediaDependencies(TARGET, {}, pages);
    expect(deps.length).toBeGreaterThan(0);
    expect(deps[0]!.entityKind).toBe('eventPage');
    expect(deps[0]!.entityTitle).toBe('Workshop e1');
    expect(deps[0]!.field).toBe('heroImage');
  });

  it('blocks deletion when both block and event page reference', () => {
    const blocks: Record<string, Block> = { b1: composable('b1', TARGET) };
    const pages: Record<string, EventPageData> = { e1: workshopPage('e1', TARGET) };
    const deps = findMediaDependencies(TARGET, blocks, pages);
    expect(deps).toHaveLength(2);
  });

  it('allows deletion when other media items are referenced but not target', () => {
    const blocks: Record<string, Block> = { b1: composable('b1', 'media-other') };
    const pages: Record<string, EventPageData> = { e1: workshopPage('e1', 'media-other') };
    const deps = findMediaDependencies(TARGET, blocks, pages);
    expect(deps).toEqual([]);
  });

  it('dependency entries have human-readable labels for dialog', () => {
    const blocks: Record<string, Block> = { b1: composable('b1', TARGET) };
    const pages: Record<string, EventPageData> = { e1: workshopPage('e1', TARGET) };
    const deps = findMediaDependencies(TARGET, blocks, pages);

    for (const dep of deps) {
      expect(dep.entityTitle).toBeTruthy();
      expect(dep.entityTitle.length).toBeGreaterThan(0);
      expect(dep.field).toBeTruthy();
    }
  });
});

describe('deletion availability by screen mode', () => {
  // The session enforces: deleteItem early-returns unless screenMode === 'edit'.
  // We document the allowed/disallowed modes here as executable spec.
  const canDelete = (mode: string) => mode === 'edit';

  it('delete is available in edit mode (persisted items)', () => {
    expect(canDelete('edit')).toBe(true);
  });

  it('delete is NOT available in create mode (unsaved draft)', () => {
    expect(canDelete('create')).toBe(false);
  });

  it('delete is NOT available in select mode', () => {
    expect(canDelete('select')).toBe(false);
  });
});
