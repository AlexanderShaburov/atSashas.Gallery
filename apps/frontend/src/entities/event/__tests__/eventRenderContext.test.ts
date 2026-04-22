import { describe, expect, it } from 'vitest';

import type { Enrollment } from '../../event';
import { createEventPage } from '../eventFactory';
import type { EventPageData } from '../eventPage.types';
import { buildEventRenderContext } from '../eventRenderContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEnrollment(status: Enrollment['paymentStatus'], id?: string): Enrollment {
  const now = new Date().toISOString();
  return {
    id: id ?? `enr-${Math.random().toString(36).slice(2, 8)}`,
    fullName: 'Test User',
    email: 'test@test.com',
    createdAt: now,
    updatedAt: now,
    status: 'pending',
    paymentStatus: status,
    createdBy: 'public',
  };
}

// ---------------------------------------------------------------------------
// A. buildEventRenderContext
// ---------------------------------------------------------------------------

describe('buildEventRenderContext', () => {
  it('zero enrollments → paidEnrollmentCount = 0', () => {
    const event = createEventPage('workshop');
    const ctx = buildEventRenderContext(event);
    expect(ctx.paidEnrollmentCount).toBe(0);
  });

  it('missing enrollments field → paidEnrollmentCount = 0', () => {
    const event = createEventPage('minimal');
    expect(event.enrollments).toBeUndefined();
    const ctx = buildEventRenderContext(event);
    expect(ctx.paidEnrollmentCount).toBe(0);
  });

  it('mixed statuses → only paid counted', () => {
    const event = createEventPage('workshop') as EventPageData;
    (event as unknown as Record<string, unknown>).enrollments = {
      a: makeEnrollment('paid', 'a'),
      b: makeEnrollment('unpaid', 'b'),
      c: makeEnrollment('paid', 'c'),
      d: makeEnrollment('unpaid', 'd'),
    };
    const ctx = buildEventRenderContext(event);
    expect(ctx.paidEnrollmentCount).toBe(2);
  });

  it('all paid → correct count', () => {
    const event = createEventPage('pleinAir') as EventPageData;
    (event as unknown as Record<string, unknown>).enrollments = {
      a: makeEnrollment('paid', 'a'),
      b: makeEnrollment('paid', 'b'),
      c: makeEnrollment('paid', 'c'),
    };
    const ctx = buildEventRenderContext(event);
    expect(ctx.paidEnrollmentCount).toBe(3);
  });

  it('all unpaid → paidEnrollmentCount = 0', () => {
    const event = createEventPage('workshop') as EventPageData;
    (event as unknown as Record<string, unknown>).enrollments = {
      a: makeEnrollment('unpaid', 'a'),
      b: makeEnrollment('unpaid', 'b'),
    };
    const ctx = buildEventRenderContext(event);
    expect(ctx.paidEnrollmentCount).toBe(0);
  });

  it('does not mutate the event object', () => {
    const event = createEventPage('workshop');
    const snapshot = JSON.stringify(event);
    buildEventRenderContext(event);
    expect(JSON.stringify(event)).toBe(snapshot);
  });
});
