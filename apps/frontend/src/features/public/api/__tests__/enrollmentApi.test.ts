// Phase 2 checks for the public enrollment API client: verifies HTTP status
// → EnrollError.code mapping and the JSON-detail extraction path, so the form
// can surface capacity and validation errors cleanly.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EnrollError, enrollPublic } from '../enrollmentApi';

type FetchMock = ReturnType<typeof vi.fn>;

function makeResponse(
    status: number,
    body: string | Record<string, unknown>,
    { ok }: { ok?: boolean } = {},
): Response {
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    const isOk = ok ?? (status >= 200 && status < 300);
    // Minimal Response stub — we only need the fields enrollPublic reads.
    return {
        ok: isOk,
        status,
        statusText: `HTTP ${status}`,
        clone() {
            return this;
        },
        async json() {
            return typeof body === 'string' ? JSON.parse(text) : body;
        },
        async text() {
            return text;
        },
    } as unknown as Response;
}

describe('enrollPublic', () => {
    let fetchMock: FetchMock;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns parsed body on 2xx', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(201, {
                enrollmentId: 'enroll-abc',
                status: 'free',
            }),
        );

        const result = await enrollPublic('event-1', {
            fullName: 'Alice',
            email: 'a@b.co',
        });

        expect(result.enrollmentId).toBe('enroll-abc');
        expect(result.status).toBe('free');
    });

    it('throws EnrollError with code "capacity" on 409', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(409, { detail: 'Event is at capacity' }),
        );

        await expect(
            enrollPublic('event-1', { fullName: 'Alice', email: 'a@b.co' }),
        ).rejects.toMatchObject({
            name: 'EnrollError',
            status: 409,
            code: 'capacity',
            message: 'Event is at capacity',
        });
    });

    it('throws EnrollError with code "validation" on 422', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(422, {
                detail: [
                    { msg: 'At least one of email or phone is required', type: 'value_error' },
                ],
            }),
        );

        try {
            await enrollPublic('event-1', { fullName: 'Bob' });
            expect.fail('expected enrollPublic to throw');
        } catch (err) {
            expect(err).toBeInstanceOf(EnrollError);
            const e = err as EnrollError;
            expect(e.code).toBe('validation');
            expect(e.status).toBe(422);
            expect(e.message).toContain('email or phone');
        }
    });

    it('throws EnrollError with code "not_open" class ("validation") on 400', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(400, { detail: 'Enrollment not open (event status: draft)' }),
        );

        try {
            await enrollPublic('event-1', { fullName: 'Bob', email: 'b@c.co' });
            expect.fail('expected enrollPublic to throw');
        } catch (err) {
            expect(err).toBeInstanceOf(EnrollError);
            expect((err as EnrollError).code).toBe('validation');
            expect((err as EnrollError).status).toBe(400);
        }
    });

    it('throws EnrollError with code "not_found" on 404', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(404, { detail: 'Event not found: event-x' }),
        );

        try {
            await enrollPublic('event-x', { fullName: 'Bob', email: 'b@c.co' });
            expect.fail('expected enrollPublic to throw');
        } catch (err) {
            expect((err as EnrollError).code).toBe('not_found');
            expect((err as EnrollError).status).toBe(404);
        }
    });

    it('throws EnrollError with code "server" on 5xx', async () => {
        fetchMock.mockResolvedValueOnce(makeResponse(500, { detail: 'Boom' }));

        try {
            await enrollPublic('event-1', { fullName: 'Bob', email: 'b@c.co' });
            expect.fail('expected enrollPublic to throw');
        } catch (err) {
            expect((err as EnrollError).code).toBe('server');
            expect((err as EnrollError).status).toBe(500);
            expect((err as EnrollError).message).toBe('Boom');
        }
    });

    it('falls back to statusText when the response is not JSON', async () => {
        // Simulate an upstream that returns plain text on error.
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 502,
            statusText: 'Bad Gateway',
            clone() {
                return this;
            },
            async json() {
                throw new Error('not json');
            },
            async text() {
                return 'Bad Gateway';
            },
        } as unknown as Response);

        try {
            await enrollPublic('event-1', { fullName: 'Bob', email: 'b@c.co' });
            expect.fail('expected enrollPublic to throw');
        } catch (err) {
            expect((err as EnrollError).message).toBe('Bad Gateway');
        }
    });

    it('sends all optional fields in the request body', async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(201, { enrollmentId: 'enroll-x', status: 'free' }),
        );

        await enrollPublic('event-1', {
            fullName: 'Alice',
            email: 'a@b.co',
            phone: '+1-555-0100',
            note: 'vegetarian',
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const body = JSON.parse(init.body as string);
        expect(body).toEqual({
            fullName: 'Alice',
            email: 'a@b.co',
            phone: '+1-555-0100',
            note: 'vegetarian',
        });
    });
});
