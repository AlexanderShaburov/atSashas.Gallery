// features/admin/mediaEditor/logic/findMediaDependencies.ts

import type { Block } from '@/entities/block/block.types';
import type { EventPageData } from '@/entities/event/eventPage.types';

export interface MediaDependency {
  entityKind: 'block' | 'eventPage';
  entityId: string;
  entityTitle: string;
  field: string;
}

/**
 * Scans blocks and event pages for references to a specific mediaItem ID.
 * Returns all dependency locations so the UI can display them and block deletion.
 */
export function findMediaDependencies(
  mediaId: string,
  blocks: Record<string, Block>,
  eventPages: Record<string, EventPageData>,
): MediaDependency[] {
  const deps: MediaDependency[] = [];

  // Scan composable blocks for MediaRenderable slots
  for (const [blockId, block] of Object.entries(blocks)) {
    if (block.blockKind !== 'composable') continue;
    const title = block.caption?.en ?? `Composable block ${blockId}`;
    for (const slot of block.slots) {
      if (slot.content.kind === 'media' && slot.content.mediaId === mediaId) {
        deps.push({ entityKind: 'block', entityId: blockId, entityTitle: title, field: 'slots' });
      }
    }
  }

  // Scan event pages
  for (const [pageId, page] of Object.entries(eventPages)) {
    const title = page.title?.en ?? page.slug ?? pageId;

    if (page.heroImage === mediaId) {
      deps.push({ entityKind: 'eventPage', entityId: pageId, entityTitle: title, field: 'heroImage' });
    }

    if ('experienceImages' in page && page.experienceImages?.includes(mediaId)) {
      deps.push({ entityKind: 'eventPage', entityId: pageId, entityTitle: title, field: 'experienceImages' });
    }

    if ('resultsImages' in page && page.resultsImages?.includes(mediaId)) {
      deps.push({ entityKind: 'eventPage', entityId: pageId, entityTitle: title, field: 'resultsImages' });
    }

    if (page.preset === 'exhibition' && page.featuredWorks) {
      if (page.featuredWorks.some((w) => w.image === mediaId)) {
        deps.push({ entityKind: 'eventPage', entityId: pageId, entityTitle: title, field: 'featuredWorks' });
      }
    }
  }

  return deps;
}
