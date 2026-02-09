import { jsx as _jsx } from "react/jsx-runtime";
//src/app/router.tsx:
import AdminLayout from '@/app/layouts/AdminLayout';
import PublicLayout from '@/app/layouts/PublicLayout';
import { BlockEditorSessionProvider } from '@/features/admin/blocks/blockEditorSession/BlockEditorSession.context';
import { CatalogEditorSessionProvider } from '@/features/admin/catalogEditor/catalogEditorSession/CatalogEditorSession.context';
import { EditorWorkspaceProvider } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { StreamEditorSessionProvider } from '@/features/admin/streams/streamEditorSession/StreamEditorSession.context';
import { ArtCatalogLoader } from '@/shared/ArtCatalogProvider/ArtCatalogLoader';
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const GalleryPage = lazy(() => import('@/pages/public/GalleryPage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const AdminIndex = lazy(() => import('@/pages/admin/AdminIndexPage'));
const UploadPage = lazy(() => import('@/pages/admin/UploadPage'));
const CatalogEditorPage = lazy(() => import('@/pages/admin/catalogEditorPage/CatalogEditorPage'));
const BlocksPage = lazy(() => import('@/pages/admin/BlocksPage/BlocksPage'));
const StreamsPage = lazy(() => import('@/pages/admin/StreamPage/StreamsPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));
// Public root wrap:
// eslint-disable-next-line react-refresh/only-export-components
function PublicRoot() {
    return (_jsx(ArtCatalogLoader, { mode: "public", children: _jsx(PublicLayout, {}) }));
}
// Admin root wrap:
// eslint-disable-next-line react-refresh/only-export-components
function AdminRoot() {
    return (_jsx(ArtCatalogLoader, { mode: "admin", children: _jsx(EditorWorkspaceProvider, { children: _jsx(AdminLayout, {}) }) }));
}
export const router = createBrowserRouter([
    {
        path: '/',
        element: _jsx(PublicRoot, {}),
        children: [
            { index: true, element: _jsx(HomePage, {}) },
            { path: 'gallery', element: _jsx(GalleryPage, {}) },
            { path: 'about', element: _jsx(AboutPage, {}) },
        ],
    },
    {
        path: '/admin',
        element: _jsx(AdminRoot, {}),
        children: [
            { index: true, element: _jsx(AdminIndex, {}) },
            { path: 'upload', element: _jsx(UploadPage, {}) },
            {
                path: 'catalog',
                element: (_jsx(CatalogEditorSessionProvider, { children: _jsx(CatalogEditorPage, {}) })),
            },
            {
                path: 'blocks',
                element: (_jsx(BlockEditorSessionProvider, { children: _jsx(BlocksPage, {}) })),
            },
            {
                path: 'streams',
                element: (_jsx(StreamEditorSessionProvider, { children: _jsx(StreamsPage, {}) })),
            },
            {
                path: 'hopper',
                element: _jsx(UploadPage, {}),
            },
        ],
    },
    { path: '*', element: _jsx(NotFound, {}) },
]);
