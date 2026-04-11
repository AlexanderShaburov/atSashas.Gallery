import type { VisitCtaData } from '../renderModel.types';

type Props = { data: VisitCtaData; onCtaClick?: () => void };

export function VisitCtaSection({ data, onCtaClick }: Props) {
  return (
    <section data-section="visitCta" className="ep-visit-cta">
      <dl className="ep-visit-cta__details">
        <div>
          <dt>Dates</dt>
          <dd>{data.dateDisplay}</dd>
        </div>
        <div>
          <dt>Hours</dt>
          <dd>{data.hours}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{data.location}</dd>
        </div>
        <div>
          <dt>Admission</dt>
          <dd>{data.admission}</dd>
        </div>
      </dl>
      {data.openingDisplay && (
        <p className="ep-visit-cta__opening">Opening: {data.openingDisplay}</p>
      )}
      <button className="ep-cta__button" type="button" onClick={onCtaClick}>{data.ctaLabel}</button>
      {data.secondaryAction && (
        <button className="ep-cta__button ep-cta__button--secondary" type="button">
          {data.secondaryAction}
        </button>
      )}
    </section>
  );
}
