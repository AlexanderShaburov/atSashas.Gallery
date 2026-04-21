import { describe, expect, it } from 'vitest';

import { resolveCtaAction } from '../ctaAction';
import type { EventPageData } from '../eventPage.types';

const baseWorkshop = (overrides: Partial<EventPageData> = {}): EventPageData => {
  return {
    id: 'ep-test',
    slug: 'test',
    preset: 'workshop',
    status: 'draft',
    title: { en: 'Test' },
    subtitle: { en: '' },
    location: { en: 'Studio' },
    description: { en: '' },
    ctaLabel: { en: 'Enroll' },
    ctaBridge: { en: '' },
    ...overrides,
  } as EventPageData;
};

describe('resolveCtaAction', () => {
  it('returns the explicit ctaAction when present', () => {
    const page = baseWorkshop({ ctaAction: { kind: 'external', url: 'https://x' } });
    expect(resolveCtaAction(page)).toEqual({ kind: 'external', url: 'https://x' });
  });

  it('returns explicit register/paid/capacity unchanged', () => {
    const page = baseWorkshop({
      ctaAction: { kind: 'register', paid: true, capacity: 10 },
    });
    expect(resolveCtaAction(page)).toEqual({ kind: 'register', paid: true, capacity: 10 });
  });

  it('infers register/free when ctaAction is absent and price is missing', () => {
    const page = baseWorkshop();
    expect(resolveCtaAction(page)).toEqual({ kind: 'register', paid: false });
  });

  it('infers register/free when price.amount is 0', () => {
    const page = baseWorkshop({ price: { amount: 0, currency: 'EUR' } });
    expect(resolveCtaAction(page)).toEqual({ kind: 'register', paid: false });
  });

  it('infers register/paid when price.amount > 0', () => {
    const page = baseWorkshop({ price: { amount: 5000, currency: 'EUR' } });
    expect(resolveCtaAction(page)).toEqual({ kind: 'register', paid: true });
  });

  it('does not backfill capacity for legacy records', () => {
    const page = baseWorkshop({ price: { amount: 5000, currency: 'EUR' } });
    const action = resolveCtaAction(page);
    expect(action.kind).toBe('register');
    if (action.kind === 'register') {
      expect(action.capacity).toBeUndefined();
    }
  });
});
