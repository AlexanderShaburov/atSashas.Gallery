// Auth-expiry contract for apiFetch + sessionBus.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '../apiFetch';
import { onSessionExpired } from '../sessionBus';

type FetchMock = ReturnType<typeof vi.fn>;

function makeResponse(status: number, body: unknown = {}): Response {
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText: `HTTP ${status}`,
        clone() {
            return this;
        },
        async json() {
            return body;
        },
        async text() {
            return text;
        },
    } as unknown as Response;
}

describe('apiFetch', () => {
    let fetchMock: FetchMock;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns the response on 2xx and does not notify session-expired', async () => {
        const seen = vi.fn();
        const off = onSessionExpired(seen);
        fetchMock.mockResolvedValueOnce(makeResponse(200, { ok: true }));

        const res = await apiFetch('/api/anything');
        expect(res.status).toBe(200);
        expect(seen).not.toHaveBeenCalled();
        off();
    });

    it('notifies session-expired subscribers on 401', async () => {
        const seen = vi.fn();
        const off = onSessionExpired(seen);
        fetchMock.mockResolvedValueOnce(makeResponse(401, { detail: 'Not authenticated' }));

        const res = await apiFetch('/api/anything');
        expect(res.status).toBe(401);
        expect(seen).toHaveBeenCalledTimes(1);
        off();
    });

    it('notifies session-expired subscribers on 403', async () => {
        const seen = vi.fn();
        const off = onSessionExpired(seen);
        fetchMock.mockResolvedValueOnce(makeResponse(403));

        await apiFetch('/api/anything');
        expect(seen).toHaveBeenCalledTimes(1);
        off();
    });

    it('does not notify on 404 / 422 / 500 — those are application errors', async () => {
        const seen = vi.fn();
        const off = onSessionExpired(seen);
        fetchMock
            .mockResolvedValueOnce(makeResponse(404))
            .mockResolvedValueOnce(makeResponse(422))
            .mockResolvedValueOnce(makeResponse(500));

        await apiFetch('/api/a');
        await apiFetch('/api/b');
        await apiFetch('/api/c');
        expect(seen).not.toHaveBeenCalled();
        off();
    });

    it('lets subscribers unsubscribe', async () => {
        const seen = vi.fn();
        const off = onSessionExpired(seen);
        off();

        fetchMock.mockResolvedValueOnce(makeResponse(401));
        await apiFetch('/api/anything');
        expect(seen).not.toHaveBeenCalled();
    });

    it('preserves the response so callers can still surface their own error message', async () => {
        const off = onSessionExpired(() => {});
        fetchMock.mockResolvedValueOnce(makeResponse(401, { detail: 'Session expired' }));

        const res = await apiFetch('/api/anything');
        const body = await res.json();
        expect(body).toEqual({ detail: 'Session expired' });
        off();
    });
});
