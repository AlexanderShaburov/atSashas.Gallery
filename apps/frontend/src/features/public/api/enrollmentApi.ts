// features/public/api/enrollmentApi.ts

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface EnrollPayload {
    fullName: string;
    email?: string;
    phone?: string;
    note?: string;
}

export interface EnrollResponse {
    enrollmentId: string;
    status: 'free' | 'checkout';
    checkoutUrl?: string;
}

export class EnrollError extends Error {
    readonly status: number;
    readonly code: 'capacity' | 'validation' | 'not_open' | 'not_found' | 'server';

    constructor(
        status: number,
        code: EnrollError['code'],
        message: string,
    ) {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'EnrollError';
    }
}

function classify(status: number): EnrollError['code'] {
    if (status === 409) return 'capacity';
    if (status === 422 || status === 400) return 'validation';
    if (status === 404) return 'not_found';
    if (status >= 500) return 'server';
    return 'validation';
}

async function parseErrorDetail(res: Response): Promise<string> {
    try {
        const data = await res.clone().json();
        if (typeof data === 'object' && data !== null && 'detail' in data) {
            const detail = (data as { detail: unknown }).detail;
            if (typeof detail === 'string') return detail;
            // FastAPI 422 returns detail as an array of issue objects; surface
            // the first message if available, otherwise stringify.
            if (Array.isArray(detail) && detail.length > 0) {
                const first = detail[0];
                if (first && typeof first === 'object' && 'msg' in first) {
                    return String((first as { msg: unknown }).msg);
                }
            }
            return JSON.stringify(detail);
        }
    } catch {
        // Non-JSON response — fall through.
    }
    return res.statusText || 'Request failed';
}

export async function enrollPublic(
    eventId: string,
    data: EnrollPayload,
): Promise<EnrollResponse> {
    const res = await fetch(`${API_BASE}/public/events/${eventId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const message = await parseErrorDetail(res);
        throw new EnrollError(res.status, classify(res.status), message);
    }
    return res.json();
}
