// Phase 4 checks for fetchEnrollmentsDetail — ensures 404 maps to a
// DetailNotFoundError and 2xx returns the parsed body.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    AdminActionError,
    createAdminEnrollment,
    DetailNotFoundError,
    fetchEnrollmentsDetail,
    fetchEnrollmentsOverview,
    patchEnrollmentContact,
    patchEnrollmentPayment,
    patchEnrollmentStatus,
    transferEnrollment,
} from '../api/enrollmentsAdminApi';

type FetchMock = ReturnType<typeof vi.fn>;

function makeResponse(
    status: number,
    body: string | Record<string, unknown> | unknown[],
): Response {
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    const ok = status >= 200 && status < 300;
    const response = {
        ok,
        status,
        statusText: `HTTP ${status}`,
        clone() {
            return response;
        },
        async json() {
            return typeof body === 'string' ? JSON.parse(text) : body;
        },
        async text() {
            return text;
        },
    };
    return response as unknown as Response;
}

describe('fetchEnrollmentsDetail', () => {
    let fetchMock: FetchMock;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns the parsed body on 200', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(200, {
                event: {
                    id: 'event-1',
                    title: 'Test Event',
                    dateStart: null,
                    status: 'scheduled',
                    capacity: null,
                },
                enrollments: [],
            }),
        );

        const result = await fetchEnrollmentsDetail('event-1');
        expect(result.event.id).toBe('event-1');
        expect(result.enrollments).toEqual([]);
    });

    it('maps 404 to DetailNotFoundError', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(404, { detail: 'Event not found: event-x' }),
        );

        await expect(fetchEnrollmentsDetail('event-x')).rejects.toBeInstanceOf(
            DetailNotFoundError,
        );
    });

    it('throws a generic Error on other non-OK responses', async () => {
        fetchMock.mockResolvedValueOnce(makeResponse(500, { detail: 'boom' }));
        await expect(fetchEnrollmentsDetail('event-1')).rejects.toThrow();
    });

    it('encodes the event id into the URL', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(200, {
                event: {
                    id: 'weird id',
                    title: '',
                    dateStart: null,
                    status: 'scheduled',
                    capacity: null,
                },
                enrollments: [],
            }),
        );
        await fetchEnrollmentsDetail('weird id');
        const [url] = fetchMock.mock.calls[0] as [string];
        expect(url).toContain('/admin/enrollments/weird%20id');
    });
});

describe('fetchEnrollmentsOverview (regression check)', () => {
    let fetchMock: FetchMock;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('still resolves on 200 after the Phase 4 module changes', async () => {
        fetchMock.mockResolvedValueOnce(makeResponse(200, []));
        const rows = await fetchEnrollmentsOverview();
        expect(rows).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// Phase 5B — admin action clients
// ---------------------------------------------------------------------------

function mockEnrollment(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: 'enr-1',
        fullName: 'Alice',
        email: 'a@b.co',
        phone: null,
        note: null,
        status: 'pending',
        paymentStatus: 'unpaid',
        createdBy: 'public',
        createdAt: '2026-04-22T00:00:00+00:00',
        updatedAt: '2026-04-22T00:00:00+00:00',
        ...overrides,
    };
}

describe('admin action clients', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('patchEnrollmentStatus sends PATCH with the new status', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(200, mockEnrollment({ status: 'confirmed' })),
        );
        const res = await patchEnrollmentStatus('event-1', 'enr-1', 'confirmed');
        expect(res.status).toBe('confirmed');
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toContain('/admin/enrollments/event-1/enr-1/status');
        expect(init.method).toBe('PATCH');
        expect(JSON.parse(init.body as string)).toEqual({ status: 'confirmed' });
    });

    it('patchEnrollmentStatus maps 409 to AdminActionError.kind="conflict"', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(409, { detail: 'Illegal status transition: pending → attended' }),
        );
        try {
            await patchEnrollmentStatus('event-1', 'enr-1', 'attended');
            expect.fail('expected throw');
        } catch (err) {
            expect(err).toBeInstanceOf(AdminActionError);
            expect((err as AdminActionError).kind).toBe('conflict');
            expect((err as AdminActionError).status).toBe(409);
        }
    });

    it('patchEnrollmentPayment sends PATCH with paymentStatus', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(200, mockEnrollment({ paymentStatus: 'paid' })),
        );
        await patchEnrollmentPayment('event-1', 'enr-1', 'paid');
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toContain('/admin/enrollments/event-1/enr-1/payment');
        expect(JSON.parse(init.body as string)).toEqual({ paymentStatus: 'paid' });
    });

    it('patchEnrollmentContact sends PATCH with partial patch body', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(200, mockEnrollment({ email: null, phone: '+1-555-0100' })),
        );
        await patchEnrollmentContact('event-1', 'enr-1', {
            email: null,
            phone: '+1-555-0100',
        });
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toMatch(/\/admin\/enrollments\/event-1\/enr-1$/);
        expect(init.method).toBe('PATCH');
        expect(JSON.parse(init.body as string)).toEqual({
            email: null,
            phone: '+1-555-0100',
        });
    });

    it('patchEnrollmentContact maps 422 to AdminActionError.kind="validation"', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(422, {
                detail: [{ msg: 'At least one of email or phone is required' }],
            }),
        );
        try {
            await patchEnrollmentContact('event-1', 'enr-1', { email: null, phone: null });
            expect.fail('expected throw');
        } catch (err) {
            expect((err as AdminActionError).kind).toBe('validation');
            expect((err as AdminActionError).status).toBe(422);
            expect((err as AdminActionError).message).toContain('email or phone');
        }
    });

    it('createAdminEnrollment posts to /admin/enrollments/:id and parses response', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(201, mockEnrollment({ id: 'enr-new', createdBy: 'admin' })),
        );
        const res = await createAdminEnrollment('event-1', {
            fullName: 'Alice',
            email: 'a@b.co',
        });
        expect(res.id).toBe('enr-new');
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toMatch(/\/admin\/enrollments\/event-1$/);
        expect(init.method).toBe('POST');
    });

    it('createAdminEnrollment surfaces 409 capacity as conflict', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(409, { detail: 'Event is at capacity' }),
        );
        try {
            await createAdminEnrollment('event-1', {
                fullName: 'Alice',
                email: 'a@b.co',
            });
            expect.fail('expected throw');
        } catch (err) {
            expect((err as AdminActionError).kind).toBe('conflict');
        }
    });

    it('transferEnrollment posts toEventPageId and parses response', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(201, {
                sourceEventPageId: 'event-a',
                sourceEnrollmentId: 'enr-a',
                destinationEventPageId: 'event-b',
                destinationEnrollmentId: 'enr-b',
                enrollment: mockEnrollment({ id: 'enr-b', createdBy: 'admin' }),
            }),
        );
        const res = await transferEnrollment('event-a', 'enr-a', 'event-b');
        expect(res.destinationEnrollmentId).toBe('enr-b');
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toMatch(/\/admin\/enrollments\/event-a\/enr-a\/transfer$/);
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body as string)).toEqual({ toEventPageId: 'event-b' });
    });

    it('transferEnrollment maps 409 to conflict', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(409, { detail: 'Destination event is at capacity' }),
        );
        try {
            await transferEnrollment('event-a', 'enr-a', 'event-b');
            expect.fail('expected throw');
        } catch (err) {
            expect((err as AdminActionError).kind).toBe('conflict');
        }
    });

    it('action client treats fetch throw as kind="network"', async () => {
        fetchMock.mockRejectedValueOnce(new Error('offline'));
        try {
            await patchEnrollmentStatus('event-1', 'enr-1', 'confirmed');
            expect.fail('expected throw');
        } catch (err) {
            expect((err as AdminActionError).kind).toBe('network');
            expect((err as AdminActionError).status).toBe(0);
        }
    });
});
