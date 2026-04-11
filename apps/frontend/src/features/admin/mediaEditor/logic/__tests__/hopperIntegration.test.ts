import { describe, expect, it } from 'vitest';

import type { JourneyTicket } from '@/shared/nav';
import type { GridItem } from '@/shared/ui/grid';
import { buildHopperTicket, processHopperReturn } from '../hopperIntegration';

// ---------------------------------------------------------------------------
// buildHopperTicket
// ---------------------------------------------------------------------------

describe('buildHopperTicket', () => {
  it('creates a ticket targeting hopper in select mode', () => {
    const ticket = buildHopperTicket();
    expect(ticket.destination).toEqual({ editor: 'hopper', mode: 'select' });
  });

  it('returns to mediaItems editor in edit mode', () => {
    const ticket = buildHopperTicket();
    expect(ticket.returnTo.editor).toBe('mediaItems');
    expect(ticket.returnTo.mode).toBe('edit');
  });

  it('generates a media-prefixed objectId for returnTo', () => {
    const ticket = buildHopperTicket();
    expect(ticket.returnTo.objectId).toMatch(/^media-\d{8}-[a-z0-9]{6}$/);
  });

  it('sets phase to outbound', () => {
    const ticket = buildHopperTicket();
    expect(ticket.phase).toBe('outbound');
  });

  it('has no returnEffect (loot presence is sufficient)', () => {
    const ticket = buildHopperTicket();
    expect(ticket.returnEffect).toBeUndefined();
  });

  it('generates unique journeyId per call', () => {
    const a = buildHopperTicket();
    const b = buildHopperTicket();
    expect(a.journeyId).not.toBe(b.journeyId);
  });

  it('includes nonce and createdAt', () => {
    const ticket = buildHopperTicket();
    expect(ticket.nonce).toBeTruthy();
    expect(ticket.createdAt).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// processHopperReturn
// ---------------------------------------------------------------------------

const LOOT_ITEM: GridItem = {
  id: 'hopper-temp-xyz',
  thumbUrl: '/media/hopper/photo.jpg',
  title: 'Uploaded Photo',
};

function makeTicket(loot: JourneyTicket['loot']): JourneyTicket {
  return {
    journeyId: 'j-1',
    destination: { editor: 'hopper', mode: 'select' },
    returnTo: { editor: 'mediaItems', mode: 'edit', objectId: 'temp-id' },
    phase: 'outbound',
    nonce: 'n-1',
    createdAt: '2026-04-08T00:00:00Z',
    returnEffect: undefined,
    loot,
  };
}

describe('processHopperReturn', () => {
  it('returns a MediaItemData when loot is present and ok', () => {
    const ticket = makeTicket({ ok: true, id: 'hopper-id', output: LOOT_ITEM });
    const result = processHopperReturn(ticket);
    expect(result).toBeDefined();
    expect(result!.media.kind).toBe('image');
    expect(result!.lifecycle).toBe('draft');
  });

  it('maps thumbUrl to media.sources.full', () => {
    const ticket = makeTicket({ ok: true, id: 'h-1', output: LOOT_ITEM });
    const result = processHopperReturn(ticket);
    expect(result!.media).toEqual({
      kind: 'image',
      sources: { preview: {}, full: '/media/hopper/photo.jpg' },
    });
  });

  it('maps title from loot GridItem', () => {
    const ticket = makeTicket({ ok: true, id: 'h-1', output: LOOT_ITEM });
    const result = processHopperReturn(ticket);
    expect(result!.title).toEqual({ en: 'Uploaded Photo' });
  });

  it('generates a media-prefixed client id', () => {
    const ticket = makeTicket({ ok: true, id: 'h-1', output: LOOT_ITEM });
    const result = processHopperReturn(ticket);
    expect(result!.id).toMatch(/^media-\d{8}-[a-z0-9]{6}$/);
  });

  it('returns undefined when ticket has no loot', () => {
    const ticket = makeTicket(undefined);
    expect(processHopperReturn(ticket)).toBeUndefined();
  });

  it('returns undefined when loot is not ok (cancelled)', () => {
    const ticket = makeTicket({ ok: false, reason: 'cancel' });
    expect(processHopperReturn(ticket)).toBeUndefined();
  });

  it('returns undefined when loot is ok but output is missing', () => {
    const ticket = makeTicket({ ok: true, id: 'h-1' });
    expect(processHopperReturn(ticket)).toBeUndefined();
  });

  it('returns undefined when loot is not ok (back)', () => {
    const ticket = makeTicket({ ok: false, reason: 'back' });
    expect(processHopperReturn(ticket)).toBeUndefined();
  });

  it('generates unique ids for different calls with same loot', () => {
    const ticket = makeTicket({ ok: true, id: 'h-1', output: LOOT_ITEM });
    const a = processHopperReturn(ticket);
    const b = processHopperReturn(ticket);
    expect(a!.id).not.toBe(b!.id);
  });
});
