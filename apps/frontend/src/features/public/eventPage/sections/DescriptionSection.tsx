import type { DescriptionData } from '../renderModel.types';

type Props = { data: DescriptionData };

export function DescriptionSection({ data }: Props) {
  return (
    <section data-section="description" className="ep-description">
      {data.label && <h2 className="ep-description__label">{data.label}</h2>}
      {data.bodyParagraphs ? (
        <>
          <p className="ep-description__thesis">{data.thesisLine}</p>
          <div className="ep-description__body">{data.bodyParagraphs}</div>
        </>
      ) : (
        <div className="ep-description__body">{data.text}</div>
      )}
    </section>
  );
}
