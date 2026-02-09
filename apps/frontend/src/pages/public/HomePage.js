import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import '@/pages/public/Home.css';
import { Link } from 'react-router-dom';
export default function HomePage() {
    const base = (import.meta.env.VITE_VAULT_BASE_URL || '/').replace(/\/+$/, '/');
    // /Users/shaburov/Documents/Programming/PROJECTS/SASHA/SashaGallery/vault/arts/mixed/full/m01.png
    console.log(`Base url: ${base}`);
    console.log(`Tile url: ${base}/arts/mixed/full/img24.png`);
    const tiles = [
        {
            to: '/watercolor',
            title: 'Watercolor',
            img: `${base}/arts/watercolor/full/img24.png`,
            posx: 50,
            posy: 50,
            zoom: 1.3,
        },
        {
            to: '/mixed-media',
            title: 'Mixed Media',
            img: `${base}/arts/mixed/full/m14.png`,
            posx: 60,
            posy: 50,
            zoom: 1.3,
        },
    ];
    return (_jsx("section", { className: "styles.container home", children: _jsx("div", { className: "tiles", children: tiles.map((t) => (_jsx("nav", { className: "home-nav", style: {}, children: _jsxs(Link, { to: t.to, className: "tile", "aria-label": t.title, style: {
                        '--pos-x': `${t.posx ?? 50}%`,
                        '--pos-y': `${t.posy ?? 50}%`,
                        '--zoom': t.zoom ?? 1,
                    }, children: [_jsx("img", { className: "tile-img", src: t.img, alt: "", "aria-hidden": "true" }), _jsx("span", { className: "tile-label", children: t.title })] }) }, t.to))) }) }));
}
