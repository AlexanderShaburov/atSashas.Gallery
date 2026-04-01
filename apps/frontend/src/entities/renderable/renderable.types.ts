// entities/renderable/renderable.types.ts

import type { Localized } from '@/entities/common';

import type { CtaTarget } from '@/entities/block/block.types';

export type ArtRenderable = {
  kind: 'art';
  artId: string;
};

export type MediaRenderable = {
  kind: 'media';
  mediaId: string;
};

export type TextVisualRenderable = {
  kind: 'textVisual';
  textVisualId: string;
};

export type CtaRenderable = {
  kind: 'cta';
  title: Localized;
  buttonLabel: Localized;
  target: CtaTarget;
  body?: Localized;
};

export type Renderable = ArtRenderable | MediaRenderable | TextVisualRenderable | CtaRenderable;

export type RenderableKind = Renderable['kind'];

export const RENDERABLE_KINDS = ['art', 'media', 'textVisual', 'cta'] as const;
