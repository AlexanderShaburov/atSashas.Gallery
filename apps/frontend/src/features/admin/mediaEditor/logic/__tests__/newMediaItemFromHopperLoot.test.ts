import { describe, expect, it } from 'vitest';

import type { GridItem } from '@/shared/ui/grid';
import { newMediaItemFromHopperLoot } from '../newMediaItemFromHopperLoot';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('newMediaItemFromHopperLoot', () => {
  const GRID_ITEM: GridItem = {
    id: 'hopper-temp-123',
    thumbUrl: '/media/hopper/uploaded-photo.jpg',
    title: 'My Photo',
  };

  it('creates a MediaItemData with image kind', () => {
    const result = newMediaItemFromHopperLoot(GRID_ITEM);
    expect(result.media.kind).toBe('image');
  });

  it('sets full source from thumbUrl', () => {
    const result = newMediaItemFromHopperLoot(GRID_ITEM);
    expect(result.media).toEqual({
      kind: 'image',
      sources: {
        preview: {},
        full: '/media/hopper/uploaded-photo.jpg',
      },
    });
  });

  it('generates a media-prefixed id', () => {
    const result = newMediaItemFromHopperLoot(GRID_ITEM);
    expect(result.id).toMatch(/^media-\d{8}-[a-z0-9]{6}$/);
  });

  it('sets lifecycle to draft', () => {
    const result = newMediaItemFromHopperLoot(GRID_ITEM);
    expect(result.lifecycle).toBe('draft');
  });

  it('sets dateCreated to today (ISO date)', () => {
    const result = newMediaItemFromHopperLoot(GRID_ITEM);
    expect(result.dateCreated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('maps title from grid item when present', () => {
    const result = newMediaItemFromHopperLoot(GRID_ITEM);
    expect(result.title).toEqual({ en: 'My Photo' });
  });

  it('sets title to undefined when grid item has no title', () => {
    const noTitle: GridItem = { id: 'h-2', thumbUrl: '/img/x.jpg' };
    const result = newMediaItemFromHopperLoot(noTitle);
    expect(result.title).toBeUndefined();
  });

  it('initializes tags as empty array', () => {
    const result = newMediaItemFromHopperLoot(GRID_ITEM);
    expect(result.tags).toEqual([]);
  });

  it('sets alt and dimensions to undefined', () => {
    const result = newMediaItemFromHopperLoot(GRID_ITEM);
    expect(result.alt).toBeUndefined();
    expect(result.dimensions).toBeUndefined();
  });

  it('generates unique ids for different calls', () => {
    const a = newMediaItemFromHopperLoot(GRID_ITEM);
    const b = newMediaItemFromHopperLoot(GRID_ITEM);
    expect(a.id).not.toBe(b.id);
  });
});
