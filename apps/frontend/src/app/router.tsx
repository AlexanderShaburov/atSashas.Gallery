//src/app/router.tsx:

import AdminLayout from '@/app/layouts/AdminLayout';
import PublicLayout from '@/app/layouts/PublicLayout';
import { RequireAuth } from '@/app/guards/RequireAuth';
import { BlockEditorSessionProvider } from '@/features/admin/blocks/blockEditorSession/BlockEditorSession.context';
import { EventEditorSessionProvider } from '@/features/admin/eventEditor/eventEditorSession/EventEditorSession.context';
import { TextVisualEditorSessionProvider } from '@/features/admin/textVisualEditor/textVisualEditorSession/TextVisualEditorSession.context';
import { CatalogEditorSessionProvider } from '@/features/admin/catalogEditor/catalogEditorSession/CatalogEditorSession.context';
import { EditorWorkspaceProvider } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { StreamEditorSessionProvider } from '@/features/admin/streams/streamEditorSession/StreamEditorSession.context';
import { ArtCatalogLoader } from '@/shared/ArtCatalogProvider/ArtCatalogLoader';
import { EventsLoader } from '@/shared/EventsProvider/EventsLoader';
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

const HomePage = lazy(() => import('@/pages/public/HomePage'));
const GalleryPage = lazy(() => import('@/pages/public/GalleryPage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const LoginPage = lazy(() => import('@/pages/admin/LoginPage'));
const AdminIndex = lazy(() => import('@/pages/admin/AdminIndexPage'));
const UploadPage = lazy(() => import('@/pages/admin/UploadPage'));
const CatalogEditorPage = lazy(() => import('@/pages/admin/catalogEditorPage/CatalogEditorPage'));
const BlocksPage = lazy(() => import('@/pages/admin/BlocksPage/BlocksPage'));
const StreamsPage = lazy(() => import('@/pages/admin/StreamPage/StreamsPage'));
const EventsPage = lazy(() => import('@/pages/admin/EventsPage'));
const TextVisualsPage = lazy(() => import('@/pages/admin/TextVisualsPage'));
const PublicStreamPage = lazy(() => import('@/pages/admin/PublicStreamPage'));
const EnrollmentSuccessPage = lazy(() => import('@/pages/public/EnrollmentSuccessPage'));
const EnrollmentCancelPage = lazy(() => import('@/pages/public/EnrollmentCancelPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Public root wrap:
// eslint-disable-next-line react-refresh/only-export-components
function PublicRoot() {
    return (
        <ArtCatalogLoader mode="public">
            <EventsLoader>
                <PublicLayout />
            </EventsLoader>
        </ArtCatalogLoader>
    );
}

// Preview root wrap (auth required, public layout):
// eslint-disable-next-line react-refresh/only-export-components
function PreviewRoot() {
    return (
        <RequireAuth>
            <ArtCatalogLoader mode="admin">
                <EventsLoader>
                    <PublicLayout />
                </EventsLoader>
            </ArtCatalogLoader>
        </RequireAuth>
    );
}

// Admin root wrap:
// eslint-disable-next-line react-refresh/only-export-components
function AdminRoot() {
    return (
        <RequireAuth>
            <ArtCatalogLoader mode="admin">
                <EventsLoader>
                    <EditorWorkspaceProvider>
                        <AdminLayout />
                    </EditorWorkspaceProvider>
                </EventsLoader>
            </ArtCatalogLoader>
        </RequireAuth>
    );
}

export const router = createBrowserRouter([
    {
        path: '/',
        element: <PublicRoot />,
        children: [
            { index: true, element: <HomePage /> },
            { path: 'gallery/:slug', element: <GalleryPage /> },
            { path: 'about', element: <AboutPage /> },
            { path: 'enrollment/success', element: <EnrollmentSuccessPage /> },
            { path: 'enrollment/cancel', element: <EnrollmentCancelPage /> },
        ],
    },
    {
        path: '/preview',
        element: <PreviewRoot />,
        children: [
            { index: true, element: <HomePage mode="preview" /> },
            { path: ':slug', element: <GalleryPage mode="preview" /> },
        ],
    },
    {
        path: '/admin/login',
        element: <LoginPage />,
    },
    {
        path: '/admin',
        element: <AdminRoot />,
        children: [
            { index: true, element: <AdminIndex /> },
            { path: 'upload', element: <UploadPage /> },
            {
                path: 'catalog',
                element: (
                    <CatalogEditorSessionProvider>
                        <CatalogEditorPage />
                    </CatalogEditorSessionProvider>
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
            {
                path: 'streams',
                element: (
                    <StreamEditorSessionProvider>
                        <StreamsPage />
                    </StreamEditorSessionProvider>
                ),
            },
            {
                path: 'events',
                element: (
                    <EventEditorSessionProvider>
                        <EventsPage />
                    </EventEditorSessionProvider>
                ),
            },
            {
                path: 'text-visuals',
                element: (
                    <TextVisualEditorSessionProvider>
                        <TextVisualsPage />
                    </TextVisualEditorSessionProvider>
                ),
            },
            {
                path: 'public-stream',
                element: <PublicStreamPage />,
            },
            {
                path: 'hopper',
                element: <UploadPage />,
            },
        ],
    },
    { path: '*', element: <NotFound /> },
]);
