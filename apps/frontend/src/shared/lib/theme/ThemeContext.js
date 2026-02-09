import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState, } from 'react';
const MODES = ['light', 'dark', 'system'];
function isMode(v) {
    return MODES.includes(v);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toMode(v, fallback = 'system') {
    return isMode(v) ? v : fallback;
}
const THEME_KEY = 'theme-mode';
const ThemeCtx = createContext(undefined);
function getSystemTheme() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export function ThemeProvider({ children }) {
    // mode id a "user defined" | "system" theme
    // "light" | "dark" | "system"
    const [mode, setMode] = useState(() => {
        if (typeof window === 'undefined')
            return 'system';
        const saved = localStorage.getItem(THEME_KEY);
        return saved ?? 'system';
    });
    // actual theme,
    const [theme, setTheme] = useState(() => mode === 'system' ? getSystemTheme() : mode);
    // reaction for  mode changing (light/dark/system):
    useEffect(() => {
        const next = mode === 'system' ? getSystemTheme() : mode;
        setTheme(next);
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(THEME_KEY, mode);
                const root = document.documentElement;
                root.setAttribute('data-theme', mode);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                root.style.colorScheme = mode; // CSS 'color-scheme' property
            }
            catch {
                // ignore
            }
        }
    }, [mode]);
    // system theme signup if "system" selected
    useEffect(() => {
        if (mode !== 'system' || typeof window === 'undefined')
            return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => setTheme(getSystemTheme());
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [mode]);
    // instant <html> theme application:
    useEffect(() => {
        if (typeof document === 'undefined')
            return;
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);
    const value = useMemo(() => ({
        mode,
        theme,
        setMode,
        toggle: () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark')),
        setLight: () => setMode('light'),
        setDark: () => setMode('dark'),
        setSystem: () => setMode('system'),
    }), [mode, theme]);
    return _jsx(ThemeCtx.Provider, { value: value, children: children });
}
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
    const ctx = useContext(ThemeCtx);
    if (!ctx)
        throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
