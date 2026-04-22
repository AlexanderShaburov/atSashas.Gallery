// features/admin/enrollments/types.ts
//
// Mirror of the backend Pydantic models in
// `apps/admin-backend/app/routers/enrollments/enrollments.py`.

import type { Enrollment } from '@/entities/event';

export interface EnrollmentOverviewRow {
    eventPageId: string;
    title: string;
    dateStart?: string | null;
    status: string; // 'draft' | 'scheduled' | 'closed'
    capacity?: number | null;
    totalCount: number;
    paidCount: number;
    cancelledCount: number;
}

export type OverviewFilter = 'upcoming' | 'past' | 'all';

export interface EnrollmentsDetailEvent {
    id: string;
    title: string;
    dateStart?: string | null;
    status: string;
    capacity?: number | null;
}

export interface EnrollmentsDetailResponse {
    event: EnrollmentsDetailEvent;
    enrollments: Enrollment[];
}
