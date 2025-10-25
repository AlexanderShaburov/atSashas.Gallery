import '@/app/layouts/PublicLayout.module.css';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
    return (
        <main className="main-layout">
            <Outlet />
        </main>
    );
}
