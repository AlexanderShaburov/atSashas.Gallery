import '@/app/layouts/AdminLayout.css';
import { AdminHeader } from '@/features/admin/shared/ui/adminHeader/AdminHeader';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
    return (
        <div className="admin-layout">
            <AdminHeader />
            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
}
