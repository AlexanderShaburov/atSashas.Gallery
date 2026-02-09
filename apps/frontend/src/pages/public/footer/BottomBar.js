import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import '@/pages/public/footer/bottomBar.css';
import { Link } from 'react-router-dom';
export default function BottomBar() {
    const year = new Date().getFullYear();
    const artist = 'Alexandra Shaburova';
    const email = 'shaburova450@gmail.com';
    const username = 'a.sasha.art';
    const sections = [
        { to: '/watercolor', label: 'Watercolor' },
        { to: '/mixed-media', label: 'Mixed Media' },
        // { to: "/about", label: "About" }, // если добавишь страницы
        // { to: "/contact", label: "Contact" },
    ];
    return (_jsxs("footer", { className: "site-footer", children: [_jsxs("div", { className: "container footer-grid", children: [_jsxs("div", { className: "footer-col", children: [_jsxs("p", { className: "footer-note", children: ["\u00A9 ", year, " ", artist, ". \u201CAll images are protected by copyright. Any publication, reproduction, or other use is permitted only with prior written consent.\u201D"] }), _jsxs("p", { className: "footer-contact", children: ["For inquiries, please contact: ", _jsx("a", { href: `mailto: ${email}`, children: email })] })] }), _jsxs("nav", { className: "footer-col", children: [_jsx("div", { className: "footer-title", children: "Explore" }), _jsx("ul", { className: "footer-links", children: sections.map((s) => (_jsx("li", { children: _jsx(Link, { to: s.to, children: s.label }) }, s.to))) })] }), _jsxs("div", { className: "footer-col", children: [_jsx("div", { className: "footer-title", children: "Get in touch" }), _jsxs("ul", { className: "footer-links", children: [_jsxs("li", { children: [' ', _jsx("a", { href: `https://www.instagram.com/${username}/`, target: "_blank", rel: "norefferrer", children: "Instagram" })] }), _jsx("li", { children: _jsx("a", { href: "https://www.behance.net/alexanrshaburo", target: "_blank", rel: "noreferrer", children: "Behance" }) })] }), _jsx("button", { className: "footer-cta", type: "button", children: "For inquiries" })] })] }), _jsx("div", { className: "container footer-bottom", children: _jsx(Link, { className: "back-to-top", to: "/", children: "Home \u2191" }) })] }));
}
