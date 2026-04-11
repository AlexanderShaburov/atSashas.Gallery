// features/admin/eventPageEditor/ui/CtaSection.tsx

import { CREATION_DEFAULTS } from '@/entities/event';
import { isFieldVisible } from './fieldVisibility';
import { LocalizedInput } from './LocalizedInput';
import type { SectionProps } from './sectionProps';
import { getLoc } from './sectionProps';

export function CtaSection({ preset, record, set }: SectionProps) {
  const vis = (f: string) => isFieldVisible(preset, f as any);
  const defaults = CREATION_DEFAULTS[preset];

  return (
    <div className="epe__section-body">
      {vis('ctaLabel') && (
        <label className="epe__field">
          <span className="epe__label">Button Label *</span>
          <LocalizedInput
            value={getLoc(record, 'ctaLabel')}
            onChange={(v) => set('ctaLabel', v)}
            placeholder={defaults.ctaLabel.en ?? 'CTA button text'}
          />
        </label>
      )}

      {vis('ctaBridge') && (
        <label className="epe__field">
          <span className="epe__label">Bridge Text *</span>
          <LocalizedInput
            value={getLoc(record, 'ctaBridge')}
            onChange={(v) => set('ctaBridge', v)}
            placeholder={defaults.ctaBridge?.en ?? 'Persuasion line above CTA'}
            multiline
            rows={2}
            hint="Appears above the CTA button as a motivating statement"
          />
        </label>
      )}

      {vis('cancellationNote') && (
        <label className="epe__field">
          <span className="epe__label">Cancellation Note</span>
          <LocalizedInput
            value={getLoc(record, 'cancellationNote')}
            onChange={(v) => set('cancellationNote', v)}
            placeholder='e.g. "Free cancellation up to 48h"'
            hint="Reassurance text below the CTA button"
          />
        </label>
      )}

      {vis('secondaryAction') && (
        <label className="epe__field">
          <span className="epe__label">Secondary Action</span>
          <LocalizedInput
            value={getLoc(record, 'secondaryAction')}
            onChange={(v) => set('secondaryAction', v)}
            placeholder='Default: "Add to calendar"'
            hint="Leave empty to use the default"
          />
        </label>
      )}
    </div>
  );
}
