// entities/block/normalizeBlock.ts

import type { Block, BlockSlot, ComposableBlock, CtaBlock, EventCtaBlock, GalleryBlock, TextBlock } from './block.types';

export function normalizeToComposable(block: Block): ComposableBlock {
  switch (block.blockKind) {
    case 'gallery':
      return normalizeGalleryBlock(block);
    case 'text':
      return normalizeTextBlock(block);
    case 'cta':
      return normalizeCtaBlock(block);
    case 'eventCta':
      return normalizeEventCtaBlock(block);
    case 'composable':
      return block;
  }
}

function normalizeGalleryBlock(block: GalleryBlock): ComposableBlock {
  const slots: BlockSlot[] = block.items.map((item) => {
    if (item.kind === 'art') {
      return {
        position: item.position,
        content: { kind: 'art' as const, artId: item.artId },
        caption: item.caption,
      };
    }
    // eventCta items — keep as art renderable with the backgroundArtId if available,
    // otherwise skip (event fragments deferred)
    return {
      position: item.position,
      content: item.backgroundArtId
        ? { kind: 'art' as const, artId: item.backgroundArtId }
        : { kind: 'art' as const, artId: '' },
    };
  });

  return {
    id: block.id,
    blockKind: 'composable',
    lifecycle: block.lifecycle,
    isTemplate: block.isTemplate,
    tags: block.tags,
    dateCreated: block.dateCreated,
    caption: block.caption,
    layout: block.layout,
    slots,
    appearance: block.appearance,
  };
}

function normalizeTextBlock(block: TextBlock): ComposableBlock {
  return {
    id: block.id,
    blockKind: 'composable',
    lifecycle: block.lifecycle,
    isTemplate: block.isTemplate,
    tags: block.tags,
    dateCreated: block.dateCreated,
    caption: block.caption,
    layout: 'single',
    slots: [
      {
        position: 'Center',
        content: {
          kind: 'cta',
          title: block.title ?? {},
          buttonLabel: {},
          target: { type: 'external' },
          body: block.body ?? undefined,
        },
      },
    ],
  };
}

function normalizeCtaBlock(block: CtaBlock): ComposableBlock {
  return {
    id: block.id,
    blockKind: 'composable',
    lifecycle: block.lifecycle,
    isTemplate: block.isTemplate,
    tags: block.tags,
    dateCreated: block.dateCreated,
    caption: block.caption,
    layout: 'single',
    slots: [
      {
        position: 'Center',
        content: {
          kind: 'cta',
          title: block.title ?? {},
          buttonLabel: block.buttonLabel ?? {},
          target: block.target ?? { type: 'external' },
          body: block.body ?? undefined,
        },
      },
    ],
  };
}

function normalizeEventCtaBlock(block: EventCtaBlock): ComposableBlock {
  // Event fragments deferred — normalize to minimal CTA placeholder
  return {
    id: block.id,
    blockKind: 'composable',
    lifecycle: block.lifecycle,
    isTemplate: block.isTemplate,
    tags: block.tags,
    dateCreated: block.dateCreated,
    caption: block.caption,
    layout: 'single',
    slots: [
      {
        position: 'Center',
        content: {
          kind: 'cta',
          title: {},
          buttonLabel: block.buttonLabel ?? {},
          target: { type: 'event', eventId: block.eventId },
        },
      },
    ],
  };
}
