import type { HostNoteData } from '../renderModel.types';

type Props = { data: HostNoteData };

export function HostNoteSection({ data }: Props) {
  return (
    <section data-section="hostNote" className="ep-host-note">
      {data.label && <h2 className="ep-host-note__label">{data.label}</h2>}
      <blockquote className="ep-host-note__quote">{data.note}</blockquote>
      {data.hostName && (
        <cite className="ep-host-note__attribution">{data.hostName}</cite>
      )}
    </section>
  );
}
