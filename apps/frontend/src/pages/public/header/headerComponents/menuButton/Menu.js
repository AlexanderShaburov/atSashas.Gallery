import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import '@/pages/public/header/headerComponents/menuButton/Menu.css';
import MenuIcon from '@/pages/public/header/headerComponents/menuButton/MenuIcon';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
export default function Menu() {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);
    const location = useLocation();
    // Закрывать при переходе по роуту
    useEffect(() => {
        close();
    }, [location.pathname]);
    // Закрытие по Esc + фиксация скролла body
    useEffect(() => {
        if (!open)
            return;
        function onKey(e) {
            if (e.key === 'Escape')
                close();
        }
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open]);
    return (_jsxs(_Fragment, { children: [_jsx("button", { className: "menu-trigger", "aria-label": "Open menu", onClick: () => setOpen(true), children: _jsx(MenuIcon, {}) }), open && (_jsxs(_Fragment, { children: [_jsx("div", { className: "menu-backdrop is-open", onClick: close }), _jsxs("aside", { className: `menu-panel ${open ? 'is-open' : ''}`, role: "dialog", "aria-modal": "true", children: [_jsxs("div", { className: "menu-head", children: [_jsx("div", { className: "menu-title", children: "Menu" }), _jsx("button", { className: "menu-close", "aria-label": "Close", onClick: close, children: "\u00D7" })] }), _jsxs("ul", { className: "menu-list", children: [_jsx("li", { className: "menu-item", children: _jsx(Link, { className: "router-link", to: "/about", onClick: close, children: "About" }) }), _jsx("li", { className: "menu-item", children: _jsx(Link, { className: "router-link", to: "/watercolor", onClick: close, children: "Watercolor" }) }), _jsx("li", { className: "menu-item", children: _jsx(Link, { className: "router-link", to: "/mixed-media", onClick: close, children: "Mix Media" }) }), _jsx("li", { className: "menu-item", children: _jsx(Link, { className: "router-link", to: "/contacts", onClick: close, children: "Contacts" }) }), _jsx("li", { className: "menu-item", children: _jsx("a", { href: "https://instagram.com/alexanrshaburo", target: "_blank", rel: "noopener noreferrer", onClick: close, children: "Instagram" }) }), _jsx("li", { className: "menu-item", children: _jsx("a", { href: "https://www.behance.net/alexanrshaburo", target: "_blank", rel: "noopener noreferrer", onClick: close, children: "Behance" }) })] }), _jsxs("div", { className: "menu-foot", children: ["\u00A9 ", new Date().getFullYear(), " \u2014 Watercolor / Mix Media"] })] })] }))] }));
}
