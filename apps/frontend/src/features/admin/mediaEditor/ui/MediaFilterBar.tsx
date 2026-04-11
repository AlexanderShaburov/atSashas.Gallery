// features/admin/mediaEditor/ui/MediaFilterBar.tsx

import type { MediaItemKind } from '@/entities/mediaItem';
import type { MediaFilterState } from '../logic/filterMediaItems';

interface Props {
  filter: MediaFilterState;
  allTags: string[];
  updateFilter: (patch: Partial<MediaFilterState>) => void;
}

export function MediaFilterBar({ filter, allTags, updateFilter }: Props) {
  const hasActiveFilters = !!(filter.kind || filter.tag || filter.search);

  return (
    <div className="media-filter-bar">
      <input
        className="media-filter-bar__input"
        type="text"
        placeholder="Search title, alt, or id..."
        value={filter.search ?? ''}
        onChange={(e) => updateFilter({ search: e.target.value || undefined })}
      />

      <select
        className="media-filter-bar__select"
        value={filter.kind ?? ''}
        onChange={(e) =>
          updateFilter({ kind: (e.target.value || undefined) as MediaItemKind | undefined })
        }
      >
        <option value="">All types</option>
        <option value="image">Images</option>
      </select>

      <select
        className="media-filter-bar__select"
        value={filter.tag ?? ''}
        onChange={(e) => updateFilter({ tag: e.target.value || undefined })}
      >
        <option value="">All tags</option>
        {allTags.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          className="media-filter-bar__clear"
          onClick={() => updateFilter({ kind: undefined, tag: undefined, search: undefined })}
        >
          Clear
        </button>
      )}
    </div>
  );
}
