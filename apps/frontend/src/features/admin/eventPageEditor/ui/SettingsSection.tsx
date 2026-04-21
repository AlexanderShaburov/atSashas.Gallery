// features/admin/eventPageEditor/ui/SettingsSection.tsx

import { RENDER_DEFAULTS } from '@/entities/event';
import type { EventStatus } from '@/entities/event';
import type { Localized } from '@/entities/common';
import { isFieldVisible, LABEL_OVERRIDE_FIELDS } from './fieldVisibility';
import type { SectionProps } from './sectionProps';
import { getLoc, getStr } from './sectionProps';

// ---------------------------------------------------------------------------
// Label override metadata
// ---------------------------------------------------------------------------

const OVERRIDE_LABELS: Record<string, string> = {
  eyebrow: 'Eyebrow',
  experienceTitle: 'Experience Gallery Title',
  resultsTitle: 'Results Gallery Title',
  featuredWorksTitle: 'Featured Works Title',
  descriptionLabel: 'Description Label',
  hostNoteLabel: 'Host Note Label',
};

function getDefault(preset: string, field: string): string {
  const defaults = RENDER_DEFAULTS[preset as keyof typeof RENDER_DEFAULTS];
  if (!defaults) return '';
  const val = defaults[field] as Localized | undefined;
  return val?.en ?? '';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsSection({ preset, record, set }: SectionProps) {
  return (
    <div className="epe__section-body">
      {/* ── System info ── */}
      <h3 className="epe__subsection-title">System</h3>

      <label className="epe__field">
        <span className="epe__label">Status</span>
        <select
          value={getStr(record, 'status') || 'draft'}
          onChange={(e) => set('status', e.target.value as EventStatus)}
        >
          <option value="draft">draft</option>
          <option value="scheduled">scheduled</option>
          {(() => {
            const cur = getStr(record, 'status');
            return cur && cur !== 'draft' && cur !== 'scheduled' ? (
              <option value={cur}>{cur}</option>
            ) : null;
          })()}
        </select>
        <span className="epe__field-hint epe__field-hint--block">
          Draft events are visible only in preview. Scheduled events are visible on the public site.
        </span>
      </label>

      <div className="epe__field epe__field--readonly">
        <span className="epe__label">Slug</span>
        <span className="epe__readonly-value">{getStr(record, 'slug')}</span>
      </div>

      <div className="epe__field epe__field--readonly">
        <span className="epe__label">ID</span>
        <span className="epe__readonly-value epe__readonly-value--mono">{getStr(record, 'id')}</span>
      </div>

      <label className="epe__field">
        <span className="epe__label">
          Linked Event ID
          <span className="epe__default-indicator"> (legacy — not used by registration)</span>
        </span>
        <input
          type="text"
          value={getStr(record, 'eventId')}
          onChange={(e) => set('eventId', e.target.value || undefined)}
          placeholder="e.g. event-YYYYMMDD-xxxxxx"
          className="epe__input--mono"
        />
        <span className="epe__field-hint epe__field-hint--block">
          Historical cross-reference to a separate Event record. The Event Page
          itself is now the enrollment target; this field is retained only for
          compatibility with records authored before 2026-04-21.
        </span>
      </label>

      {/* ── Label overrides ── */}
      <h3 className="epe__subsection-title">Label Overrides</h3>
      <p className="epe__field-hint epe__field-hint--block">
        Override default section headings. Leave empty to use the preset default.
      </p>

      {LABEL_OVERRIDE_FIELDS.map((field) => {
        if (!isFieldVisible(preset, field)) return null;
        const currentValue = getLoc(record, field);
        const defaultValue = getDefault(preset, field);
        const hasOverride = currentValue?.en !== undefined && currentValue.en !== '';

        return (
          <label key={field} className="epe__field">
            <span className="epe__label">
              {OVERRIDE_LABELS[field] ?? field}
              {!hasOverride && defaultValue && (
                <span className="epe__default-indicator"> (default)</span>
              )}
            </span>
            <div className="epe__override-input">
              <input
                type="text"
                value={currentValue?.en ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  set(field, val ? { ...currentValue, en: val } : undefined);
                }}
                placeholder={defaultValue || 'Override...'}
                className={hasOverride ? '' : 'epe__input--default'}
              />
              {hasOverride && (
                <button
                  type="button"
                  className="epe__btn epe__btn--reset"
                  onClick={() => set(field, undefined)}
                  title="Reset to default"
                >
                  ✕
                </button>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
