import Footer from '@/shared/footer/BottomBar';
import Header from '@/shared/header/Header';
import { Outlet } from 'react-router-dom';
import { CatalogProvider } from '@/features/gallery/api/CatalogProvider';

import './publicLayout.css';

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
