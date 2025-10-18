import { Localized } from '@/entities/common/locales';
import { DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS } from 'react';

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
    preview: PreviewSources | DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS;
    full: FullPath;
}
