import { AppProviders } from '@/app/providers/AppProviders';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '@/app/index.css';
import { router } from '@/app/router';

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AppProviders>
            <RouterProvider router={router} />
        </AppProviders>
    </React.StrictMode>,
);
