import { jsx as _jsx } from "react/jsx-runtime";
import { AppProviders } from '@/app/providers/AppProviders';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '@/app/index.css';
import { router } from '@/app/router';
createRoot(document.getElementById('root')).render(
// <React.StrictMode>
_jsx(AppProviders, { children: _jsx(RouterProvider, { router: router }) }));
