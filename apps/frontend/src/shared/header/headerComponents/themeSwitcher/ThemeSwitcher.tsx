/* eslint-disable no-unused-vars */
import { useTheme } from '@/shared/lib/theme/ThemeContext';
import { SunIcon } from '@/shared/header/headerComponents/themeSwitcher/SunIcon';
import { MoonIcon } from '@/shared/header/headerComponents/themeSwitcher/MoonIcon';
import '@/shared/header/headerComponents/themeSwitcher/ThemeSwitcher.module.css';

export default function ThemeSwitcher() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { theme, mode, toggle, setLight, setDark, setSystem } = useTheme();

    return (
        <button
            type="button"
            aria-label="Toggle theme"
            className="btn themeSwitcherButton"
            onClick={toggle}
        >
            {theme === 'dark' ? <SunIcon size={24} /> : <MoonIcon size={24} />}
        </button>
    );
}
