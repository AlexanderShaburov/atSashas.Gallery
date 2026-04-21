// features/admin/eventPageEditor/ui/CtaSection.tsx

import { CREATION_DEFAULTS, CTA_ACTION_KINDS, resolveCtaAction } from '@/entities/event';
import type { CtaAction, CtaActionKind, EventPageData } from '@/entities/event';
import type { AllFieldKeys } from './fieldVisibility';
import { isFieldVisible } from './fieldVisibility';
import { LocalizedInput } from './LocalizedInput';
import type { SectionProps } from './sectionProps';
import { getLoc } from './sectionProps';

// ---------------------------------------------------------------------------
// CTA Action block — selects the behavior invoked when a visitor clicks the
// primary CTA on the public event page. Resolved to a concrete CtaAction
// during render via resolveCtaAction(), which handles legacy records.
// ---------------------------------------------------------------------------

const KIND_LABEL: Record<CtaActionKind, string> = {
  external: 'External link',
  register: 'Registration',
  inquiry: 'Inquiry',
};

const KIND_HINT: Record<CtaActionKind, string> = {
  external: 'Opens a URL in a new tab (e.g. external ticket provider).',
  register:
    'Opens the registration form on the public page. Requires status = scheduled and a linked Event ID.',
  inquiry: 'Opens a contact form / email. (Stubbed in Phase 1.)',
};

function coerceKind(raw: string): CtaActionKind {
  return (CTA_ACTION_KINDS as readonly string[]).includes(raw) ? (raw as CtaActionKind) : 'register';
}

function defaultForKind(kind: CtaActionKind): CtaAction {
  switch (kind) {
    case 'external':
      return { kind: 'external', url: '' };
    case 'register':
      return { kind: 'register', paid: false };
    case 'inquiry':
      return { kind: 'inquiry' };
  }
}

export function CtaSection({ preset, record, set }: SectionProps) {
  const vis = (f: string) => isFieldVisible(preset, f as AllFieldKeys);
  const defaults = CREATION_DEFAULTS[preset];

  // resolveCtaAction accepts EventPageData; the editor's record matches by shape.
  const resolved = resolveCtaAction(record as unknown as EventPageData);

  const setAction = (next: CtaAction) => set('ctaAction', next);

  return (
    <div className="epe__section-body">
      {/* ── CTA Action ──────────────────────────────────────────── */}
      <label className="epe__field">
        <span className="epe__label">CTA Action</span>
        <select
          value={resolved.kind}
          onChange={(e) => setAction(defaultForKind(coerceKind(e.target.value)))}
        >
          {CTA_ACTION_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
        <span className="epe__field-hint epe__field-hint--block">{KIND_HINT[resolved.kind]}</span>
      </label>

      {resolved.kind === 'external' && (
        <label className="epe__field">
          <span className="epe__label">External URL *</span>
          <input
            type="url"
            value={resolved.url}
            onChange={(e) => setAction({ kind: 'external', url: e.target.value })}
            placeholder="https://tickets.example.com/…"
          />
        </label>
      )}

      {resolved.kind === 'register' && (
        <>
          <label className="epe__field">
            <span className="epe__label">Paid registration</span>
            <input
              type="checkbox"
              checked={resolved.paid}
              onChange={(e) =>
                setAction({
                  kind: 'register',
                  paid: e.target.checked,
                  capacity: resolved.capacity,
                })
              }
            />
            <span className="epe__field-hint epe__field-hint--block">
              When checked, registration flows through Stripe. Pricing uses the Schedule &amp;
              Venue → Price field.
            </span>
          </label>

          <label className="epe__field">
            <span className="epe__label">Capacity</span>
            <input
              type="number"
              min={1}
              value={resolved.capacity ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                setAction({
                  kind: 'register',
                  paid: resolved.paid,
                  capacity: v === '' ? undefined : Math.max(1, Number(v) | 0),
                });
              }}
              placeholder="Unlimited"
            />
            <span className="epe__field-hint epe__field-hint--block">
              Maximum registrations. Enforcement lands in Phase 4 — leave empty for no cap.
            </span>
          </label>
        </>
      )}

      {resolved.kind === 'inquiry' && (
        <label className="epe__field">
          <span className="epe__label">Recipient email</span>
          <input
            type="email"
            value={resolved.toEmail ?? ''}
            onChange={(e) =>
              setAction({ kind: 'inquiry', toEmail: e.target.value || undefined })
            }
            placeholder="owner@example.com (defaults to site owner)"
          />
        </label>
      )}

      {/* ── Existing CTA copy fields ────────────────────────────── */}
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
