// features/admin/eventPageEditor/ui/SettingsSection.tsx

import { RENDER_DEFAULTS } from '@/entities/event';
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

      <div className="epe__field epe__field--readonly">
        <span className="epe__label">Status</span>
        <span className="epe__readonly-value">{getStr(record, 'status')}</span>
      </div>

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
          <span className="epe__default-indicator"> (for enrollment)</span>
        </span>
        <input
          type="text"
          value={getStr(record, 'eventId')}
          onChange={(e) => set('eventId', e.target.value || undefined)}
          placeholder="e.g. event-20260214-cx1vra"
          className="epe__input--mono"
        />
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
