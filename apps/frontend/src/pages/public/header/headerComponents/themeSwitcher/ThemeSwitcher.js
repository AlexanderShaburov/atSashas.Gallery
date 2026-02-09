import { jsx as _jsx } from "react/jsx-runtime";
import { MoonIcon } from '@/pages/public/header/headerComponents/themeSwitcher/MoonIcon';
import { SunIcon } from '@/pages/public/header/headerComponents/themeSwitcher/SunIcon';
import '@/pages/public/header/headerComponents/themeSwitcher/ThemeSwitcher.css';
import { useTheme } from '@/shared/lib/theme/ThemeContext';
export default function ThemeSwitcher() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { theme, mode, toggle, setLight, setDark, setSystem } = useTheme();
    return (_jsx("button", { type: "button", "aria-label": "Toggle theme", className: "btn themeSwitcherButton", onClick: toggle, children: theme === 'dark' ? _jsx(SunIcon, { size: 24 }) : _jsx(MoonIcon, { size: 24 }) }));
}
