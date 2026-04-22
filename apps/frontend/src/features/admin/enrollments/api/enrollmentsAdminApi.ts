// features/admin/enrollments/api/enrollmentsAdminApi.ts
//
// Client for the admin enrollments surfaces.
//   Phase 3: overview aggregation.
//   Phase 4: per-event detail (event header + enrollments roster).
//   Phase 5A: action endpoints (status / payment / contact / create /
//             transfer) — wired here for Phase 5B UI consumption.

import type { Enrollment, EnrollmentStatus, PaymentStatus } from '@/entities/event';

import type {
    EnrollmentOverviewRow,
    EnrollmentsDetailResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const OVERVIEW_URL = `${API_BASE}/admin/enrollments/overview`;
const ADMIN_ENROLLMENTS_URL = `${API_BASE}/admin/enrollments`;
const DETAIL_URL = (eventPageId: string) =>
    `${ADMIN_ENROLLMENTS_URL}/${encodeURIComponent(eventPageId)}`;
const ENROLLMENT_URL = (eventPageId: string, enrollmentId: string) =>
    `${DETAIL_URL(eventPageId)}/${encodeURIComponent(enrollmentId)}`;

export class DetailNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DetailNotFoundError';
    }
}

/**
 * Typed error surface for admin action endpoints. `kind` maps HTTP status
 * to an action-layer concept the UI can switch on:
 *   - `not_found` (404)       — event or enrollment missing
 *   - `conflict`  (409)       — illegal transition / capacity full / terminal source
 *   - `validation` (400, 422) — malformed input / contact-missing
 *   - `server`   (5xx)
 *   - `network`  (fetch threw)
 */
export type AdminActionErrorKind =
    | 'not_found'
    | 'conflict'
    | 'validation'
    | 'server'
    | 'network';

export class AdminActionError extends Error {
    readonly status: number;
    readonly kind: AdminActionErrorKind;

    constructor(status: number, kind: AdminActionErrorKind, message: string) {
        super(message);
        this.name = 'AdminActionError';
        this.status = status;
        this.kind = kind;
    }
}

function classify(status: number): AdminActionErrorKind {
    if (status === 404) return 'not_found';
    if (status === 409) return 'conflict';
    if (status === 400 || status === 422) return 'validation';
    if (status >= 500) return 'server';
    return 'validation';
}

async function parseErrorDetail(res: Response): Promise<string> {
    try {
        const data = await res.clone().json();
        if (typeof data === 'object' && data !== null && 'detail' in data) {
            const detail = (data as { detail: unknown }).detail;
            if (typeof detail === 'string') return detail;
            if (Array.isArray(detail) && detail.length > 0) {
                const first = detail[0];
                if (first && typeof first === 'object' && 'msg' in first) {
                    return String((first as { msg: unknown }).msg);
                }
            }
            return JSON.stringify(detail);
        }
    } catch {
        // Non-JSON — fall through.
    }
    return res.statusText || 'Request failed';
}

async function adminJsonRequest<T>(
    url: string,
    init: RequestInit,
): Promise<T> {
    let res: Response;
    try {
        res = await fetch(url, init);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        throw new AdminActionError(0, 'network', message);
    }
    if (!res.ok) {
        const message = await parseErrorDetail(res);
        throw new AdminActionError(res.status, classify(res.status), message);
    }
    return (await res.json()) as T;
}

export async function fetchEnrollmentsOverview(
    signal?: AbortSignal,
): Promise<EnrollmentOverviewRow[]> {
    const res = await fetch(OVERVIEW_URL, { signal });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to load enrollments overview: ${res.statusText}`);
    }
    return (await res.json()) as EnrollmentOverviewRow[];
}

export async function fetchEnrollmentsDetail(
    eventPageId: string,
    signal?: AbortSignal,
): Promise<EnrollmentsDetailResponse> {
    const res = await fetch(DETAIL_URL(eventPageId), { signal });
    if (res.status === 404) {
        throw new DetailNotFoundError(`Event not found: ${eventPageId}`);
    }
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to load enrollment detail: ${res.statusText}`);
    }
    return (await res.json()) as EnrollmentsDetailResponse;
}

// ---------------------------------------------------------------------------
// Phase 5B — admin mutation clients.
// ---------------------------------------------------------------------------

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function patchEnrollmentStatus(
    eventPageId: string,
    enrollmentId: string,
    status: EnrollmentStatus,
): Promise<Enrollment> {
    return adminJsonRequest<Enrollment>(
        `${ENROLLMENT_URL(eventPageId, enrollmentId)}/status`,
        {
            method: 'PATCH',
            headers: JSON_HEADERS,
            body: JSON.stringify({ status }),
        },
    );
}

export async function patchEnrollmentPayment(
    eventPageId: string,
    enrollmentId: string,
    paymentStatus: PaymentStatus,
): Promise<Enrollment> {
    return adminJsonRequest<Enrollment>(
        `${ENROLLMENT_URL(eventPageId, enrollmentId)}/payment`,
        {
            method: 'PATCH',
            headers: JSON_HEADERS,
            body: JSON.stringify({ paymentStatus }),
        },
    );
}

export interface ContactUpdatePayload {
    fullName?: string;
    email?: string | null;
    phone?: string | null;
    note?: string | null;
}

export async function patchEnrollmentContact(
    eventPageId: string,
    enrollmentId: string,
    patch: ContactUpdatePayload,
): Promise<Enrollment> {
    return adminJsonRequest<Enrollment>(
        ENROLLMENT_URL(eventPageId, enrollmentId),
        {
            method: 'PATCH',
            headers: JSON_HEADERS,
            body: JSON.stringify(patch),
        },
    );
}

export interface AdminCreateEnrollmentPayload {
    fullName: string;
    email?: string;
    phone?: string;
    note?: string;
    status?: EnrollmentStatus;
    paymentStatus?: PaymentStatus;
}

export async function createAdminEnrollment(
    eventPageId: string,
    payload: AdminCreateEnrollmentPayload,
): Promise<Enrollment> {
    return adminJsonRequest<Enrollment>(DETAIL_URL(eventPageId), {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
    });
}

export interface TransferResponseBody {
    sourceEventPageId: string;
    sourceEnrollmentId: string;
    destinationEventPageId: string;
    destinationEnrollmentId: string;
    enrollment: Enrollment;
}

export async function transferEnrollment(
    eventPageId: string,
    enrollmentId: string,
    toEventPageId: string,
): Promise<TransferResponseBody> {
    return adminJsonRequest<TransferResponseBody>(
        `${ENROLLMENT_URL(eventPageId, enrollmentId)}/transfer`,
        {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify({ toEventPageId }),
        },
    );
}
