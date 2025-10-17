import Home from '@/features/gallery/pages/HomePage';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import MainLayout from './layouts/PublicLayout';
import GalleryPage from '../features/gallery/GalleryPage';
import AdminApp from '../features/admin/pages/AdminApp';
import About from '../features/gallery/pages/AboutPage';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <div className="common-background">
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/gallery/:slug" element={<GalleryPage />} />
          <Route path="/admin" element={<AdminApp />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </div>
  );
}
