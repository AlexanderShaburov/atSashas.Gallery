import {
  createContext,
  JSX,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const MODES = ['light', 'dark', 'system'] as const;
export type Mode = (typeof MODES)[number];

function isMode(v: unknown): v is Mode {
  return MODES.includes(v as Mode);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toMode(v: unknown, fallback: Mode = 'system'): Mode {
  return isMode(v) ? v : fallback;
}

type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  mode: Mode;
  theme: Theme;
  setMode: (m: Mode) => void;
  toggle: () => void;
  setLight: () => void;
  setDark: () => void;
  setSystem: () => void;
}

const THEME_KEY = 'theme-mode';

const ThemeCtx = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  // mode id a "user defined" | "system" theme
  // "light" | "dark" | "system"

  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = localStorage.getItem(THEME_KEY) as Mode | null;
    return saved ?? 'system';
  });

  // actual theme,
  const [theme, setTheme] = useState<Theme>(() =>
    mode === 'system' ? getSystemTheme() : (mode as Theme),
  );

  // reaction for  mode changing (light/dark/system):
  useEffect(() => {
    const next: Theme = mode === 'system' ? getSystemTheme() : (mode as Theme);
    setTheme(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(THEME_KEY, mode);
      } catch {
        // ignore
      }
    }
  }, [mode]);

  // system theme signup if "system" selected
  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setTheme(getSystemTheme());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  // instant <html> theme application:
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme,
      setMode,
      toggle: () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark')),
      setLight: () => setMode('light'),
      setDark: () => setMode('dark'),
      setSystem: () => setMode('system'),
    }),
    [mode, theme],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
