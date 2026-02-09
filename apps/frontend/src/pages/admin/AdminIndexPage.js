import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import '@/pages/admin/AdminIndex.css';
import { NavLink } from 'react-router-dom';
const tiles = [
    {
        to: '/admin/upload',
        title: 'Upload',
        emoji: '📤',
        description: 'Upload new artworks to server hopper.',
    },
    {
        to: '/admin/catalog',
        title: 'Catalog',
        emoji: '🗂️',
        description: 'Select, edit metadata, and import to catalog.',
    },
    {
        to: '/admin/blocks',
        title: 'Blocks',
        emoji: '🧩',
        description: 'Assemble visual blocks with drag & drop.',
    },
    {
        to: '/admin/streams',
        title: 'Streams',
        emoji: '📽',
        description: 'Compose a stream from saved blocks.',
    },
];
export default function AdminIndexPage() {
    return (_jsxs("div", { className: "admin-index", children: [_jsxs("header", { className: "admin-index__header", children: [_jsx("h1", { children: "Admin Panel" }), _jsx("p", { className: "admin-index__subtitle", children: "Choose a step to continue your workflow." })] }), _jsx("section", { className: "admin-index__grid", children: tiles.map((t) => (_jsxs(NavLink, { to: t.to, className: ({ isActive }) => `admin-index__tile ${isActive ? 'admin-index__tile--active' : ''}`, children: [_jsx("div", { className: "admin-index__emoji", "aria-hidden": true, children: t.emoji }), _jsxs("div", { className: "admin-index__text", children: [_jsx("h2", { children: t.title }), _jsx("p", { children: t.description })] })] }, t.to))) })] }));
}
