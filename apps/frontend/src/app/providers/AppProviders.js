import { jsx as _jsx } from "react/jsx-runtime";
import { ThemeProvider } from '@/app/providers/ThemeProvider';
export function AppProviders({ children }) {
    return _jsx(ThemeProvider, { children: children });
}
