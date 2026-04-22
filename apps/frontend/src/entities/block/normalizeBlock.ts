// entities/block/normalizeBlock.ts

import type { Block, BlockSlot, ComposableBlock, CtaBlock, GalleryBlock, TextBlock } from './block.types';

export function normalizeToComposable(block: Block): ComposableBlock {
  switch (block.blockKind) {
    case 'gallery':
      return normalizeGalleryBlock(block);
    case 'text':
      return normalizeTextBlock(block);
    case 'cta':
      return normalizeCtaBlock(block);
    case 'composable':
      return block;
  }
}

function normalizeGalleryBlock(block: GalleryBlock): ComposableBlock {
  const slots: BlockSlot[] = block.items.map((item) => ({
    position: item.position,
    content: { kind: 'art' as const, artId: item.artId },
    caption: item.caption,
  }));

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
