import { Localized } from '@/entities/common/locales';

export type ImageExt = 'avif' | 'webp' | 'jpeg' | 'jpg' | 'png';

export type PreviewPath = `arts/previews/${string}.${'avif' | 'webp' | 'jpeg' | 'jpg'}`;
export type FullPath = `arts/fullsize/${string}.${ImageExt}`;

export interface PreviewSources {
  avif?: PreviewPath;
  webp?: PreviewPath;
  jpeg?: PreviewPath;
}

export interface ImagesJSON {
  alt: Localized;
  preview: PreviewSources;
  full: FullPath;
}
