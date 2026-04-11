import { describe, expect, it } from 'vitest';

import type { MediaItemData } from '@/entities/mediaItem';
import { filterMediaItems, type MediaFilterState } from '../filterMediaItems';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const IMG_A: MediaItemData = {
  id: 'media-20260401-aaaaaa',
  lifecycle: 'draft',
  dateCreated: '2026-04-01',
  media: { kind: 'image', sources: { preview: {}, full: '/img/a.jpg' } },
  title: { en: 'Sunset Landscape' },
  alt: { en: 'A sunset over hills' },
  tags: ['nature', 'landscape'],
};

const IMG_B: MediaItemData = {
  id: 'media-20260402-bbbbbb',
  lifecycle: 'published',
  dateCreated: '2026-04-02',
  media: { kind: 'image', sources: { preview: {}, full: '/img/b.jpg' } },
  title: { en: 'City Night' },
  alt: undefined,
  tags: ['urban'],
};

const VID_C: MediaItemData = {
  id: 'media-20260403-cccccc',
  lifecycle: 'draft',
  dateCreated: '2026-04-03',
  media: { kind: 'video', sources: { url: '/vid/c.mp4' } },
  title: { en: 'Workshop Timelapse' },
  alt: undefined,
  tags: ['workshop'],
};

const ITEMS = [IMG_A, IMG_B, VID_C];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('filterMediaItems', () => {
  it('returns all items when filter is empty', () => {
    expect(filterMediaItems(ITEMS, {})).toEqual(ITEMS);
  });

  it('filters by kind=image', () => {
    const result = filterMediaItems(ITEMS, { kind: 'image' });
    expect(result).toEqual([IMG_A, IMG_B]);
  });

  it('filters by kind=video', () => {
    const result = filterMediaItems(ITEMS, { kind: 'video' });
    expect(result).toEqual([VID_C]);
  });

  it('filters by lifecycle', () => {
    const result = filterMediaItems(ITEMS, { lifecycle: 'published' });
    expect(result).toEqual([IMG_B]);
  });

  it('filters by tag', () => {
    const result = filterMediaItems(ITEMS, { tag: 'nature' });
    expect(result).toEqual([IMG_A]);
  });

  it('returns empty when tag matches nothing', () => {
    expect(filterMediaItems(ITEMS, { tag: 'nonexistent' })).toEqual([]);
  });

  it('filters by search in title', () => {
    const result = filterMediaItems(ITEMS, { search: 'sunset' });
    expect(result).toEqual([IMG_A]);
  });

  it('search is case-insensitive', () => {
    const result = filterMediaItems(ITEMS, { search: 'CITY' });
    expect(result).toEqual([IMG_B]);
  });

  it('filters by search in alt text', () => {
    const result = filterMediaItems(ITEMS, { search: 'hills' });
    expect(result).toEqual([IMG_A]);
  });

  it('filters by search in id', () => {
    const result = filterMediaItems(ITEMS, { search: 'bbbbbb' });
    expect(result).toEqual([IMG_B]);
  });

  it('search with whitespace-only is ignored', () => {
    expect(filterMediaItems(ITEMS, { search: '   ' })).toEqual(ITEMS);
  });

  it('combines multiple filters (AND logic)', () => {
    const filter: MediaFilterState = { kind: 'image', lifecycle: 'draft' };
    expect(filterMediaItems(ITEMS, filter)).toEqual([IMG_A]);
  });

  it('combines kind + tag + search', () => {
    const filter: MediaFilterState = { kind: 'image', tag: 'nature', search: 'sunset' };
    expect(filterMediaItems(ITEMS, filter)).toEqual([IMG_A]);
  });

  it('returns empty when combined filters contradict', () => {
    const filter: MediaFilterState = { kind: 'video', tag: 'urban' };
    expect(filterMediaItems(ITEMS, filter)).toEqual([]);
  });

  it('handles items with no title or alt gracefully', () => {
    const bare: MediaItemData = {
      id: 'media-20260404-dddddd',
      lifecycle: 'draft',
      dateCreated: '2026-04-04',
      media: { kind: 'image', sources: { preview: {}, full: '/img/d.jpg' } },
    };
    expect(filterMediaItems([bare], { search: 'anything' })).toEqual([]);
    expect(filterMediaItems([bare], {})).toEqual([bare]);
  });

  it('handles empty items array', () => {
    expect(filterMediaItems([], { kind: 'image' })).toEqual([]);
  });
});
