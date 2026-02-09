import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { CatalogProvider } from '@/features/public/api/CatalogProvider';
import Footer from '@/pages/public/footer/BottomBar';
import Header from '@/pages/public/header/Header';
import { Outlet } from 'react-router-dom';
import '@/app/layouts/PublicLayout.css';
export default function PublicLayout() {
    return (_jsxs(_Fragment, { children: [_jsx(Header, {}), _jsx("main", { className: "main-layout", children: _jsx(CatalogProvider, { children: _jsx(Outlet, {}) }) }), _jsx(Footer, {})] }));
}
