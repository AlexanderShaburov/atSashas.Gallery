// entities/mediaItem/mediaItem.types.ts

import type { EntityLifecycle, ISODate, Localized } from '@/entities/common';

export const MEDIA_ITEM_KINDS = ['image', 'video'] as const;
export type MediaItemKind = (typeof MEDIA_ITEM_KINDS)[number];

export interface ImageSources {
  preview: {
    avif?: string;
    webp?: string;
    jpeg?: string;
  };
  full: string;
}

export interface VideoSources {
  url: string;
  posterUrl?: string;
}

export type MediaSources =
  | { kind: 'image'; sources: ImageSources }
  | { kind: 'video'; sources: VideoSources };

export interface MediaItemData {
  id: string;
  lifecycle: EntityLifecycle;
  dateCreated: ISODate;
  media: MediaSources;
  title?: Localized;
  alt?: Localized;
  dimensions?: { width: number; height: number };
  tags?: string[];
}
