import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";

const HomePage = lazy(() => import('@/features/gallery/pages/HomePage'));
const GalleryPage = lazy(() => import('@/features/gallery/GalleryPage'))
const AboutPage = lazy(() => import('@/features/gallery/pages/AboutPage'))
const UploadPage = lazy(() => import('@/features/admin/pages/AdminApp'))
const CatalogPage = lazy(() => import('@/features/admin/pages/CatalogPage'))
const BlocksPage = lazy(() => import('@/features/admin/pages/BlocksPage'))
const StreamsPage = lazy(() => import('@/features/admin/pages/StreamsPage'))
const NotFound = lazy(() => import('./pages/NotFound'))

export const router = createBrowserRouter([
    {
        path: '/',
        element: <PublicLayout />,
        children: [
            {index: true, element: <HomePage />},
            {path: 'gallery', element: <GalleryPage />},
            {path: 'about', element: <AboutPage />},
        ],
    },
    {
        path: '/admin',
        element: <AdminLayout />,
        children: [
            {index: true, element: <UploadPage />},
            {path: 'upload', element: <UploadPage />},
            {path: 'catalog', element: <CatalogPage />},
            {path: 'blocks', element: <BlocksPage />},
            {path: 'stream', element: <StreamsPage />},
        ],
    },
     {path: '*', element: <NotFound />},
])
