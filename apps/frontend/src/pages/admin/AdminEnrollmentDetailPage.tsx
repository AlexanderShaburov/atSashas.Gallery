// pages/admin/AdminEnrollmentDetailPage.tsx
//
// Per-event enrollments detail view (Phase 4 of
// knowledge/plans/plan--admin--event-enrollments-management.md).

import { Link, useParams } from 'react-router-dom';

import { AdminEnrollmentsDetail } from '@/features/admin/enrollments/ui/AdminEnrollmentsDetail';

export default function AdminEnrollmentDetailPage() {
    const { eventPageId } = useParams<{ eventPageId: string }>();

    if (!eventPageId) {
        return (
            <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1.25rem' }}>
                <p style={{ marginBottom: '0.75rem' }}>
                    <Link to="/admin/enrollments">← All enrollments</Link>
                </p>
                <h2>Missing event id</h2>
                <p>This URL needs an event page id.</p>
            </div>
        );
    }

    return <AdminEnrollmentsDetail eventPageId={eventPageId} />;
}
