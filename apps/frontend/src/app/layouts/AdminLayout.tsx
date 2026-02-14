// src/app/layouts/AdminLayout.tsx

import '@/app/layouts/AdminLayout.css';
import { AdminHeader } from '@/features/admin/shared/ui/adminHeader/AdminHeader';
import { DestructiveOverlay } from '@/features/admin/shared/ui/DestructiveOverlay/DestructiveOverlay';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
    return (
        <div className="admin-layout">
            <AdminHeader />
            <DestructiveOverlay />
            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
}
