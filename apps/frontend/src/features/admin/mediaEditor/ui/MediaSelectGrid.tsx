// features/admin/mediaEditor/ui/MediaSelectGrid.tsx

import type { Localized } from '@/entities/common';
import type { MediaItemData } from '@/entities/mediaItem';

interface Props {
  items: MediaItemData[];
  onSelect: (id: string) => void;
}

/** Pick the best available locale value, matching MediaRenderableView pattern: jpeg → full */
function resolveThumbUrl(item: MediaItemData): string | undefined {
  if (item.media.kind === 'image') {
    const { preview, full } = item.media.sources;
    return preview.jpeg ?? full;
  }
  if (item.media.kind === 'video') {
    return item.media.sources.posterUrl;
  }
  return undefined;
}

/** First populated locale value, or undefined. Matches admin label pattern. */
function bestLocalizedValue(loc: Localized | undefined): string | undefined {
  if (!loc) return undefined;
  for (const v of Object.values(loc)) {
    if (v) return v;
  }
  return undefined;
}

export function MediaSelectGrid({ items, onSelect }: Props) {
  if (items.length === 0) {
    return <div className="media-grid media-grid--empty">No media items match the filter.</div>;
  }

  return (
    <div className="media-grid">
      {items.map((item) => {
        const thumb = resolveThumbUrl(item);
        const label = bestLocalizedValue(item.title) ?? item.id;
        const altText = bestLocalizedValue(item.alt) ?? label;

        return (
          <button
            key={item.id}
            type="button"
            className="media-grid__item"
            onClick={() => onSelect(item.id)}
          >
            {thumb ? (
              <img src={thumb} alt={altText} loading="lazy" />
            ) : (
              <div className="media-grid__placeholder">No preview</div>
            )}
            <div className="media-grid__label">{label}</div>
          </button>
        );
      })}
    </div>
  );
}
