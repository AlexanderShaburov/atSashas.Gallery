import { jsx as _jsx } from "react/jsx-runtime";
import { useTheme } from '@/shared/lib/theme/ThemeContext';
import { Link } from 'react-router-dom';
import logoLight from './images/logo/LogoBlack.png';
import logoDark from './images/logo/LogoWhite.png';
export default function Logo() {
    const currentTheme = useTheme();
    const src = currentTheme.theme === 'dark' ? logoDark : logoLight;
    return (_jsx(Link, { to: "/", className: "logoSign", "aria-label": "Home", children: _jsx("img", { src: src, alt: "logo", height: 40 }) }));
}
