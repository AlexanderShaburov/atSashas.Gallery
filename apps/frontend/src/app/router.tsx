import AdminLayout from '@/app/layouts/AdminLayout';
import PublicLayout from '@/app/layouts/PublicLayout';
import { BlockEditorSessionProvider } from '@/features/admin/blocks/editorSession/BlockEditorSession.context';
import { EditorSessionProvider } from '@/features/admin/catalogEditor/editorSession/EditorSession.context';
import { EditorWorkspaceProvider } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

const HomePage = lazy(() => import('@/pages/public/HomePage'));
const GalleryPage = lazy(() => import('@/pages/public/GalleryPage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const AdminIndex = lazy(() => import('@/pages/admin/AdminIndexPage'));
const UploadPage = lazy(() => import('@/pages/admin/UploadPage'));
const CatalogEditorPage = lazy(() => import('@/pages/admin/catalogEditorPage/CatalogEditorPage'));
const BlocksPage = lazy(() => import('@/pages/admin/BlocksPage/BlocksPage'));
const StreamsPage = lazy(() => import('@/pages/admin/StreamsPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export const router = createBrowserRouter([
    {
        path: '/',
        element: <PublicLayout />,
        children: [
            { index: true, element: <HomePage /> },
            { path: 'gallery', element: <GalleryPage /> },
            { path: 'about', element: <AboutPage /> },
        ],
    },
    {
        path: '/admin',
        element: (
            <EditorWorkspaceProvider>
                <AdminLayout />
            </EditorWorkspaceProvider>
        ),
        children: [
            { index: true, element: <AdminIndex /> },
            { path: 'upload', element: <UploadPage /> },
            {
                path: 'catalog',
                element: (
                    <EditorSessionProvider>
                        <CatalogEditorPage />
                    </EditorSessionProvider>
                ),
            },
            {
                path: 'blocks',
                element: (
                    <BlockEditorSessionProvider>
                        <BlocksPage />
                    </BlockEditorSessionProvider>
                ),
            },
            { path: 'stream', element: <StreamsPage /> },
        ],
    },
    { path: '*', element: <NotFound /> },
]);
