// entities/renderable/renderableResolver.types.ts

import type { ArtItemData } from '@/entities/art';
import type { MediaItemData } from '@/entities/mediaItem';
import type { TextVisualData } from '@/entities/textVisual';

export interface RenderableResolver {
  resolveArt: (artId: string) => ArtItemData | undefined;
  resolveMedia: (mediaId: string) => MediaItemData | undefined;
  resolveTextVisual: (textVisualId: string) => TextVisualData | undefined;
}
