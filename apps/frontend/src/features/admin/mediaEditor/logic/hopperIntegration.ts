// features/admin/mediaEditor/logic/hopperIntegration.ts
// Pure functions for Hopper Journey integration — testable without React.

import type { MediaItemData } from '@/entities/mediaItem';
import type { JourneyTicket } from '@/shared/nav';
import type { GridItem } from '@/shared/ui/grid';
import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { generateId } from '@/shared/lib/id/generateId';
import { newMediaItemFromHopperLoot } from './newMediaItemFromHopperLoot';

/** Build a Journey ticket dispatching from Media Editor to Hopper. */
export function buildHopperTicket(): JourneyTicket {
  const tempId = generateId('media');
  return {
    journeyId: generateId('travel'),
    destination: { editor: 'hopper', mode: 'select' },
    returnTo: { editor: 'mediaItems', mode: 'edit', objectId: tempId },
    phase: 'outbound',
    nonce: createNonce(),
    createdAt: nowIso(),
    returnEffect: undefined,
  };
}

/**
 * Process a Hopper return ticket.
 * Returns a new MediaItemData draft if loot is present and valid, or undefined.
 */
export function processHopperReturn(
  ticket: JourneyTicket,
): MediaItemData | undefined {
  if (!ticket.loot) return undefined;
  if (!ticket.loot.ok) return undefined;
  if (!ticket.loot.output) return undefined;
  return newMediaItemFromHopperLoot(ticket.loot.output as GridItem);
}
