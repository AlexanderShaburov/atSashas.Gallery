import type { Renderable, RenderableResolver } from '@/entities/renderable';

import { ArtRenderableView } from './ArtRenderableView';
import { CtaRenderableView } from './CtaRenderableView';
import { MediaRenderableView } from './MediaRenderableView';
import { TextVisualRenderableView } from './TextVisualRenderableView';

type Props = {
  renderable: Renderable;
  resolver: RenderableResolver;
  onClick?: (e: React.MouseEvent) => void;
  imgStyle?: React.CSSProperties;
};

export function RenderableView({ renderable, resolver, onClick, imgStyle }: Props) {
  switch (renderable.kind) {
    case 'art': {
      const art = resolver.resolveArt(renderable.artId);
      if (!art) return null;
      return <ArtRenderableView art={art} onClick={onClick} imgStyle={imgStyle} />;
    }
    case 'media': {
      const media = resolver.resolveMedia(renderable.mediaId);
      if (!media) return null;
      return <MediaRenderableView media={media} onClick={onClick} imgStyle={imgStyle} />;
    }
    case 'textVisual': {
      const tv = resolver.resolveTextVisual(renderable.textVisualId);
      if (!tv) return null;
      return <TextVisualRenderableView textVisual={tv} onClick={onClick} />;
    }
    case 'cta':
      return <CtaRenderableView cta={renderable} onClick={onClick} />;
  }
}
