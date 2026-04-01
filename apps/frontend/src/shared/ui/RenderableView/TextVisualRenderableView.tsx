import type { TextVisualData } from '@/entities/textVisual';

import './TextVisualRenderableView.css';

type Props = {
  textVisual: TextVisualData;
  onClick?: (e: React.MouseEvent) => void;
};

export function TextVisualRenderableView({ textVisual, onClick }: Props) {
  const { background, typography, textBox, overlay } = textVisual;

  const backgroundStyle: React.CSSProperties =
    background.kind === 'image'
      ? { backgroundImage: `url(${background.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : background.kind === 'gradient'
        ? { background: background.gradient }
        : { backgroundColor: background.color };

  const textStyle: React.CSSProperties = {
    fontFamily: typography.fontFamily,
    fontSize: `${typography.fontSize}px`,
    fontWeight: typography.fontWeight,
    textAlign: typography.textAlign,
    lineHeight: typography.lineHeight,
    color: typography.color,
  };

  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${textBox.x}%`,
    top: `${textBox.y}%`,
    width: `${textBox.width}%`,
    height: `${textBox.height}%`,
    padding: `${textBox.padding}px`,
  };

  return (
    <div className="text-visual" style={backgroundStyle} onClick={onClick}>
      {overlay && (
        <div
          className="text-visual__overlay"
          style={{
            backgroundColor: overlay.color,
            opacity: overlay.opacity,
            ...(overlay.blur ? { backdropFilter: `blur(${overlay.blur}px)` } : {}),
          }}
        />
      )}
      <div className="text-visual__content" style={boxStyle}>
        {textVisual.title?.en && <h3 style={textStyle}>{textVisual.title.en}</h3>}
        {textVisual.subtitle?.en && (
          <p className="text-visual__subtitle" style={textStyle}>
            {textVisual.subtitle.en}
          </p>
        )}
        {textVisual.body?.en && <p style={textStyle}>{textVisual.body.en}</p>}
      </div>
    </div>
  );
}
