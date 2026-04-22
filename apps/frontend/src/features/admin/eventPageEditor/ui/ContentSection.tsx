// features/admin/eventPageEditor/ui/ContentSection.tsx

import type { AllFieldKeys } from './fieldVisibility';
import { isFieldVisible } from './fieldVisibility';
import { LocalizedInput } from './LocalizedInput';
import type { SectionProps } from './sectionProps';
import { getLoc, getStr } from './sectionProps';

export function ContentSection({ preset, record, set }: SectionProps) {
  const vis = (f: string) => isFieldVisible(preset, f as AllFieldKeys);

  return (
    <div className="epe__section-body">
      <label className="epe__field">
        <span className="epe__label">Title *</span>
        <LocalizedInput
          value={getLoc(record, 'title')}
          onChange={(v) => set('title', v)}
          placeholder="Event title"
        />
      </label>

      {vis('subtitle') && (
        <label className="epe__field">
          <span className="epe__label">Subtitle</span>
          <LocalizedInput
            value={getLoc(record, 'subtitle')}
            onChange={(v) => set('subtitle', v)}
            placeholder="Short subtitle"
          />
        </label>
      )}

      <label className="epe__field">
        <span className="epe__label">Description *</span>
        <LocalizedInput
          value={getLoc(record, 'description')}
          onChange={(v) => set('description', v)}
          placeholder="Event description"
          multiline
          rows={4}
          hint={
            preset === 'exhibition'
              ? 'Separate thesis from body with a blank line'
              : preset === 'minimal'
                ? 'Keep short — 1–2 sentences for the card'
                : undefined
          }
        />
      </label>

      {vis('extendedDescription') && (
        <label className="epe__field">
          <span className="epe__label">Extended Description</span>
          <LocalizedInput
            value={getLoc(record, 'extendedDescription')}
            onChange={(v) => set('extendedDescription', v)}
            placeholder="Below-the-fold details (optional)"
            multiline
            rows={4}
          />
        </label>
      )}

      {vis('bridgeLine') && (
        <label className="epe__field">
          <span className="epe__label">Bridge Line *</span>
          <LocalizedInput
            value={getLoc(record, 'bridgeLine')}
            onChange={(v) => set('bridgeLine', v)}
            placeholder="Short connecting phrase"
            hint="Appears as an emphasized line between hero and description"
          />
        </label>
      )}

      {vis('hostNote') && (
        <>
          <label className="epe__field">
            <span className="epe__label">Host Note</span>
            <LocalizedInput
              value={getLoc(record, 'hostNote')}
              onChange={(v) => set('hostNote', v)}
              placeholder="A personal note from the host"
              multiline
              rows={3}
            />
          </label>

          {vis('hostName') && (
            <label className="epe__field">
              <span className="epe__label">Host Name</span>
              <input
                type="text"
                value={getStr(record, 'hostName')}
                onChange={(e) => set('hostName', e.target.value || undefined)}
                placeholder="Name for attribution"
              />
            </label>
          )}
        </>
      )}
    </div>
  );
}
