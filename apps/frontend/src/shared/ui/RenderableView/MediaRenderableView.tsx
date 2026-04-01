import type { MediaItemData } from '@/entities/mediaItem';

type Props = {
  media: MediaItemData;
  onClick?: (e: React.MouseEvent) => void;
  imgStyle?: React.CSSProperties;
};

export function MediaRenderableView({ media, onClick, imgStyle }: Props) {
  if (media.media.kind === 'video') {
    const { url, posterUrl } = media.media.sources;
    return (
      <video
        src={url}
        poster={posterUrl}
        controls
        style={imgStyle}
        onClick={onClick}
      />
    );
  }

  const { sources } = media.media;
  const alt = media.alt?.en || media.title?.en || '';

  return (
    <picture onClick={onClick}>
      {sources.preview.avif && <source type="image/avif" srcSet={sources.preview.avif} />}
      {sources.preview.webp && <source type="image/webp" srcSet={sources.preview.webp} />}
      <img src={sources.preview.jpeg || sources.full} alt={alt} loading="lazy" style={imgStyle} />
    </picture>
  );
}
