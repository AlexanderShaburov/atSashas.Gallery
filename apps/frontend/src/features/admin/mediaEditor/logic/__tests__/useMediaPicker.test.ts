import { describe, expect, it } from 'vitest';

import { buildMediaPickerTicket } from '../useMediaPicker';

describe('buildMediaPickerTicket', () => {
  it('targets mediaItems editor in select mode', () => {
    const ticket = buildMediaPickerTicket('eventPages', 'evp-123');
    expect(ticket.destination).toEqual({ editor: 'mediaItems', mode: 'select' });
  });

  it('returns to the caller editor in edit mode with the given objectId', () => {
    const ticket = buildMediaPickerTicket('eventPages', 'evp-123');
    expect(ticket.returnTo).toEqual({ editor: 'eventPages', mode: 'edit', objectId: 'evp-123' });
  });

  it('sets phase to outbound', () => {
    const ticket = buildMediaPickerTicket('eventPages', 'evp-123');
    expect(ticket.phase).toBe('outbound');
  });

  it('has no returnEffect (return handled by caller bootstrap)', () => {
    const ticket = buildMediaPickerTicket('eventPages', 'evp-123');
    expect(ticket.returnEffect).toBeUndefined();
  });

  it('generates unique journeyId per call', () => {
    const a = buildMediaPickerTicket('eventPages', 'e1');
    const b = buildMediaPickerTicket('eventPages', 'e1');
    expect(a.journeyId).not.toBe(b.journeyId);
  });

  it('works with different caller editors', () => {
    const fromStream = buildMediaPickerTicket('stream', 'str-1');
    expect(fromStream.returnTo.editor).toBe('stream');

    const fromBlock = buildMediaPickerTicket('block', 'blk-1');
    expect(fromBlock.returnTo.editor).toBe('block');
  });
});
