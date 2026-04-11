import type { BridgeData } from '../renderModel.types';

type Props = { data: BridgeData };

export function BridgeSection({ data }: Props) {
  return (
    <section data-section="bridge" className="ep-bridge">
      <p className="ep-bridge__text">{data.text}</p>
    </section>
  );
}
