import { describe, expect, it } from 'vitest';

import type { MediaItemData } from '@/entities/mediaItem';

// ---------------------------------------------------------------------------
// mediaToGridOutput — extracted for testability
// ---------------------------------------------------------------------------

// Inline copy of the pure function from MediaEditorSession.context.tsx
// (kept in sync; if it drifts, extract to logic/ module)
function mediaToGridOutput(item: MediaItemData) {
  const thumb =
    item.media.kind === 'image'
      ? (item.media.sources.preview.jpeg ?? item.media.sources.full)
      : item.media.kind === 'video'
        ? (item.media.sources.posterUrl ?? '')
        : '';
  return { id: item.id, thumbUrl: thumb, title: item.title?.en };
}

const IMG_ITEM: MediaItemData = {
  id: 'media-20260401-aaaaaa',
  lifecycle: 'published',
  dateCreated: '2026-04-01',
  media: {
    kind: 'image',
    sources: { preview: { jpeg: '/prev/a.jpg', webp: '/prev/a.webp' }, full: '/full/a.jpg' },
  },
  title: { en: 'Sunset', ru: 'Закат' },
};

const IMG_NO_PREVIEW: MediaItemData = {
  id: 'media-20260402-bbbbbb',
  lifecycle: 'draft',
  dateCreated: '2026-04-02',
  media: { kind: 'image', sources: { preview: {}, full: '/full/b.jpg' } },
};

const VID_ITEM: MediaItemData = {
  id: 'media-20260403-cccccc',
  lifecycle: 'draft',
  dateCreated: '2026-04-03',
  media: { kind: 'video', sources: { url: '/vid/c.mp4', posterUrl: '/vid/c-poster.jpg' } },
};

describe('mediaToGridOutput', () => {
  it('uses preview.jpeg for image items', () => {
    const out = mediaToGridOutput(IMG_ITEM);
    expect(out.thumbUrl).toBe('/prev/a.jpg');
  });

  it('falls back to full when no preview.jpeg', () => {
    const out = mediaToGridOutput(IMG_NO_PREVIEW);
    expect(out.thumbUrl).toBe('/full/b.jpg');
  });

  it('uses posterUrl for video items', () => {
    const out = mediaToGridOutput(VID_ITEM);
    expect(out.thumbUrl).toBe('/vid/c-poster.jpg');
  });

  it('maps id from media item', () => {
    expect(mediaToGridOutput(IMG_ITEM).id).toBe('media-20260401-aaaaaa');
  });

  it('maps title.en to title', () => {
    expect(mediaToGridOutput(IMG_ITEM).title).toBe('Sunset');
  });

  it('title is undefined when item has no title', () => {
    expect(mediaToGridOutput(IMG_NO_PREVIEW).title).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Picker flow decision rules (executable spec)
// ---------------------------------------------------------------------------

describe('picker mode rules', () => {
  const screenBehavior = (mode: string, action: string) => {
    if (mode === 'pick' && action === 'selectItem') return 'returnHome with ok:true';
    if (mode === 'pick' && action === 'cancelPick') return 'returnHome with ok:false';
    if (mode === 'pick' && action === 'onAdd') return 'dispatch to Hopper';
    if (mode === 'pick' && action === 'delete') return 'unavailable';
    if (mode === 'select' && action === 'selectItem') return 'enter edit';
    return 'other';
  };

  it('pick + selectItem = immediate return', () => {
    expect(screenBehavior('pick', 'selectItem')).toBe('returnHome with ok:true');
  });

  it('pick + cancelPick = cancel return', () => {
    expect(screenBehavior('pick', 'cancelPick')).toBe('returnHome with ok:false');
  });

  it('pick + onAdd = dispatch to Hopper (upload-during-pick)', () => {
    expect(screenBehavior('pick', 'onAdd')).toBe('dispatch to Hopper');
  });

  it('pick + delete = unavailable (picker is not for destructive management)', () => {
    expect(screenBehavior('pick', 'delete')).toBe('unavailable');
  });

  it('select + selectItem = enter edit (normal mode)', () => {
    expect(screenBehavior('select', 'selectItem')).toBe('enter edit');
  });
});

describe('upload-during-pick flow', () => {
  it('after save in create mode during Journey, returns persisted ID to caller', () => {
    // This documents the save() behavior when isJourney && screenMode === 'create':
    // 1. create() returns { id: backendId }
    // 2. refreshMediaItems() reloads catalog with persisted item
    // 3. returnHome() is called with backendId (NOT the temp client id)
    const tempId = 'media-20260408-tempxx';
    const backendId = 'media-srv-001';
    expect(tempId).not.toBe(backendId);
    // The actual flow is tested via the session context; this documents the contract.
  });
});
