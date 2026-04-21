// entities/event/ctaAction.ts
// CTA action config attached to EventPageData. Phase 1 of the CTA &
// Registration system — see knowledge/plans/plan--events--cta-registration-system.md.
// The entity carries config only; behavior lives in the public runtime.

import type { EventPageData } from './eventPage.types';

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export type CtaActionExternal = {
  kind: 'external';
  url: string;
};

export type CtaActionRegister = {
  kind: 'register';
  paid: boolean;
  capacity?: number;
};

export type CtaActionInquiry = {
  kind: 'inquiry';
  toEmail?: string;
};

export type CtaAction = CtaActionExternal | CtaActionRegister | CtaActionInquiry;

export const CTA_ACTION_KINDS = ['external', 'register', 'inquiry'] as const;
export type CtaActionKind = (typeof CTA_ACTION_KINDS)[number];

// ---------------------------------------------------------------------------
// Runtime resolver — handles legacy records lacking ctaAction.
// Inference: price > 0 → paid registration; otherwise free registration.
// No migration is performed; this is a read-time default.
// ---------------------------------------------------------------------------

export function resolveCtaAction(page: EventPageData): CtaAction {
  const rec = page as unknown as { ctaAction?: CtaAction };
  if (rec.ctaAction) return rec.ctaAction;

  const price = (page as unknown as { price?: { amount?: number } }).price;
  const paid = !!(price && typeof price.amount === 'number' && price.amount > 0);
  return { kind: 'register', paid };
}
