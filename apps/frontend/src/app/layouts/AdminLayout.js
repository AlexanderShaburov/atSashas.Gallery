import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import '@/app/layouts/AdminLayout.css';
import { AdminHeader } from '@/features/admin/shared/ui/adminHeader/AdminHeader';
import { Outlet } from 'react-router-dom';
export default function AdminLayout() {
    return (_jsxs("div", { className: "admin-layout", children: [_jsx(AdminHeader, {}), _jsx("main", { className: "admin-main", children: _jsx(Outlet, {}) })] }));
}
