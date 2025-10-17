import Footer from '@/shared/footer/BottomBar';
import Header from '@/shared/header/Header';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
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
