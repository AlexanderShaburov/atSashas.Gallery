import Footer from '@/components/footer/BottomBar';
import Header from '@/components/header/Header';
import { Outlet } from 'react-router-dom';

import '../../features/gallery/components/gallery.css';

export default function MainLayout() {
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
