// src/app/layouts/PublicLayout.tsx

import Footer from '@/pages/public/footer/BottomBar';
import Header from '@/pages/public/header/Header';
import { Outlet } from 'react-router-dom';

import '@/app/layouts/PublicLayout.css';

// Art catalog is loaded by <ArtCatalogLoader> higher in the route tree
// (PublicRoot / PreviewRoot / AdminRoot) via /api/json/art_catalog and
// consumed through useArtCatalog(). An earlier duplicate CatalogProvider
// pointing at a non-existent static path (/media/arts/catalog.json) has
// been removed — it had no live consumers and produced a 404 on every
// public page mount.
export default function PublicLayout() {
    return (
        <>
            <Header />
            <main className="main-layout">
                <Outlet />
            </main>
            <Footer />
        </>
    );
}
