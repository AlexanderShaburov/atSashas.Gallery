import type { QuickFactsData } from '../renderModel.types';

type Props = { data: QuickFactsData };

export function QuickFactsSection({ data }: Props) {
  return (
    <section data-section="quickFacts" className="ep-quick-facts">
      <dl className="ep-quick-facts__list">
        {data.items.map((item) => (
          <div key={item.label} className="ep-quick-facts__item">
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
