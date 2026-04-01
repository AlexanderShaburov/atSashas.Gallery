import type { ArtItemData } from '@/entities/art';
import { ArtPicture } from '@/shared/ui/ArtPicture';

type Props = {
  art: ArtItemData;
  onClick?: (e: React.MouseEvent) => void;
  imgStyle?: React.CSSProperties;
};

export function ArtRenderableView({ art, onClick, imgStyle }: Props) {
  return (
    <ArtPicture
      sources={art.images.preview}
      alt={art.images.alt?.en || art.title?.en || ''}
      onClick={onClick}
      imgStyle={imgStyle}
    />
  );
}
