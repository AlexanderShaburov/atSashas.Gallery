import type { CtaRenderable } from '@/entities/renderable';

import './CtaRenderableView.css';

type Props = {
  cta: CtaRenderable;
  onClick?: (e: React.MouseEvent) => void;
};

export function CtaRenderableView({ cta, onClick }: Props) {
  return (
    <div className="cta-renderable" onClick={onClick}>
      {cta.title?.en && <h3 className="cta-renderable__title">{cta.title.en}</h3>}
      {cta.body?.en && <p className="cta-renderable__body">{cta.body.en}</p>}
      {cta.buttonLabel?.en && (
        <button className="cta-renderable__button" type="button">
          {cta.buttonLabel.en}
        </button>
      )}
    </div>
  );
}
