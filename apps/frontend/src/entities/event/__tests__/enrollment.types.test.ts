// Phase 1 sanity checks for the frontend mirror of the Enrollment model.
// Covers the constants surface and a minimal `satisfies Enrollment` build
// check. Backward-compat coercion itself is a backend concern; the frontend
// sees already-normalized records, so coercion is exercised in
// apps/admin-backend/tests/test_unit_enrollment_model.py.

import { describe, expect, it } from 'vitest';

import {
  ENROLLMENT_CREATED_BY,
  ENROLLMENT_STATUSES,
  EVENT_STATUSES,
  PAYMENT_STATUSES,
  type Enrollment,
} from '../enrollment.types';

describe('enrollment constants mirror the backend enums', () => {
  it('EVENT_STATUSES', () => {
    expect([...EVENT_STATUSES]).toEqual(['draft', 'scheduled', 'closed']);
  });

  it('PAYMENT_STATUSES is the simplified dual-state set', () => {
    expect([...PAYMENT_STATUSES]).toEqual(['unpaid', 'paid']);
    // Retired legacy values must not appear in the active set.
    expect(PAYMENT_STATUSES).not.toContain('pending' as never);
    expect(PAYMENT_STATUSES).not.toContain('failed' as never);
  });

  it('ENROLLMENT_STATUSES covers the six process states from the plan', () => {
    expect([...ENROLLMENT_STATUSES]).toEqual([
      'pending',
      'confirmed',
      'cancelled_by_user',
      'cancelled_by_admin',
      'no_show',
      'attended',
    ]);
  });

  it('ENROLLMENT_CREATED_BY', () => {
    expect([...ENROLLMENT_CREATED_BY]).toEqual(['public', 'admin']);
  });
});

describe('Enrollment interface accepts Phase 1 shape', () => {
  it('minimal valid record with defaults', () => {
    const e = {
      id: 'enr-20260422-abc001',
      fullName: 'Alice',
      email: 'alice@example.com',
      createdAt: '2026-04-22T00:00:00+00:00',
      updatedAt: '2026-04-22T00:00:00+00:00',
      status: 'pending',
      paymentStatus: 'unpaid',
      createdBy: 'public',
    } satisfies Enrollment;

    expect(e.status).toBe('pending');
  });

  it('admin-authored record with phone and note', () => {
    const e = {
      id: 'enr-20260422-adm001',
      fullName: 'Bob',
      email: 'bob@example.com',
      phone: '+1-555-0101',
      note: 'VIP guest',
      createdAt: '2026-04-22T10:00:00+00:00',
      updatedAt: '2026-04-22T11:00:00+00:00',
      status: 'confirmed',
      paymentStatus: 'paid',
      createdBy: 'admin',
    } satisfies Enrollment;

    expect(e.createdBy).toBe('admin');
    expect(e.phone).toBe('+1-555-0101');
    expect(e.note).toBe('VIP guest');
  });
});
