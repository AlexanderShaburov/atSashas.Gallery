// src/app/layouts/PublicLayout.tsx

import { CatalogProvider } from '@/features/public/api/CatalogProvider';
import Footer from '@/pages/public/footer/BottomBar';
import Header from '@/pages/public/header/Header';
import { Outlet } from 'react-router-dom';

import '@/app/layouts/PublicLayout.css';

export default function PublicLayout() {
    return (
        <>
            <Header />
            <main className="main-layout">
                <CatalogProvider>
                    <Outlet />
                </CatalogProvider>
            </main>
            <Footer />
        </>
    );
}
