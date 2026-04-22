// features/admin/eventPageEditor/ui/LogisticsSection.tsx

import type { AllFieldKeys } from './fieldVisibility';
import { isFieldVisible } from './fieldVisibility';
import { LocalizedInput } from './LocalizedInput';
import type { SectionProps } from './sectionProps';
import { getLoc, getStr, getNum } from './sectionProps';

export function LogisticsSection({ preset, record, set }: SectionProps) {
  const vis = (f: string) => isFieldVisible(preset, f as AllFieldKeys);

  const price = record['price'] as { amount: number; currency: string } | undefined;

  return (
    <div className="epe__section-body">
      {/* ── When ── */}
      <h3 className="epe__subsection-title">When</h3>

      {vis('dateStart') && (
        <label className="epe__field">
          <span className="epe__label">Start Date *</span>
          <input
            type="date"
            value={getStr(record, 'dateStart')}
            onChange={(e) => set('dateStart', e.target.value || undefined)}
          />
        </label>
      )}

      {vis('dateEnd') && (
        <label className="epe__field">
          <span className="epe__label">End Date</span>
          <input
            type="date"
            value={getStr(record, 'dateEnd')}
            onChange={(e) => set('dateEnd', e.target.value || undefined)}
          />
        </label>
      )}

      {vis('duration') && (
        <label className="epe__field">
          <span className="epe__label">Duration *</span>
          <LocalizedInput
            value={getLoc(record, 'duration')}
            onChange={(v) => set('duration', v)}
            placeholder='e.g. "3 hours"'
          />
        </label>
      )}

      {vis('time') && (
        <label className="epe__field">
          <span className="epe__label">Time</span>
          <input
            type="text"
            value={getStr(record, 'time')}
            onChange={(e) => set('time', e.target.value || undefined)}
            placeholder='e.g. "19:00"'
          />
        </label>
      )}

      {vis('sessions') && (
        <label className="epe__field">
          <span className="epe__label">Sessions *</span>
          <LocalizedInput
            value={getLoc(record, 'sessions')}
            onChange={(v) => set('sessions', v)}
            placeholder='e.g. "2 morning sessions"'
          />
        </label>
      )}

      {vis('openingDate') && (
        <label className="epe__field">
          <span className="epe__label">Opening Date</span>
          <input
            type="date"
            value={getStr(record, 'openingDate')}
            onChange={(e) => set('openingDate', e.target.value || undefined)}
          />
        </label>
      )}

      {vis('openingTime') && (
        <label className="epe__field">
          <span className="epe__label">Opening Time</span>
          <input
            type="text"
            value={getStr(record, 'openingTime')}
            onChange={(e) => set('openingTime', e.target.value || undefined)}
            placeholder='e.g. "18:00"'
          />
        </label>
      )}

      {vis('hours') && (
        <label className="epe__field">
          <span className="epe__label">Opening Hours *</span>
          <LocalizedInput
            value={getLoc(record, 'hours')}
            onChange={(v) => set('hours', v)}
            placeholder='e.g. "Tue–Sat, 11–18"'
          />
        </label>
      )}

      {/* ── Where ── */}
      <h3 className="epe__subsection-title">Where</h3>

      {vis('location') && (
        <label className="epe__field">
          <span className="epe__label">Location *</span>
          <LocalizedInput
            value={getLoc(record, 'location')}
            onChange={(v) => set('location', v)}
            placeholder="Venue or address"
          />
        </label>
      )}

      {vis('meetingPoint') && (
        <label className="epe__field">
          <span className="epe__label">Meeting Point *</span>
          <LocalizedInput
            value={getLoc(record, 'meetingPoint')}
            onChange={(v) => set('meetingPoint', v)}
            placeholder="Where participants meet"
          />
        </label>
      )}

      {vis('mapUrl') && (
        <label className="epe__field">
          <span className="epe__label">Map URL</span>
          <input
            type="url"
            value={getStr(record, 'mapUrl')}
            onChange={(e) => set('mapUrl', e.target.value || undefined)}
            placeholder="https://maps.google.com/..."
          />
        </label>
      )}

      {/* ── Pricing ── */}
      <h3 className="epe__subsection-title">Pricing</h3>

      {vis('price') && (
        <label className="epe__field">
          <span className="epe__label">Price</span>
          <div className="epe__money-input">
            <input
              type="number"
              min="0"
              value={price?.amount ?? ''}
              onChange={(e) => {
                const amount = e.target.value ? Number(e.target.value) : 0;
                set('price', { amount, currency: price?.currency ?? 'EUR' });
              }}
              placeholder="0 = Free"
            />
            <span className="epe__currency">{price?.currency ?? 'EUR'}</span>
          </div>
        </label>
      )}

      {vis('capacity') && (
        <label className="epe__field">
          <span className="epe__label">Capacity</span>
          <input
            type="number"
            min="1"
            value={getNum(record, 'capacity') ?? ''}
            onChange={(e) => set('capacity', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Max participants"
          />
        </label>
      )}

      {vis('groupSize') && (
        <label className="epe__field">
          <span className="epe__label">Group Size *</span>
          <input
            type="number"
            min="1"
            value={getNum(record, 'groupSize') ?? ''}
            onChange={(e) => set('groupSize', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Max participants"
          />
        </label>
      )}

      {vis('admission') && (
        <label className="epe__field">
          <span className="epe__label">Admission *</span>
          <LocalizedInput
            value={getLoc(record, 'admission')}
            onChange={(v) => set('admission', v)}
            placeholder='e.g. "Free" or "€10"'
          />
        </label>
      )}
    </div>
  );
}
