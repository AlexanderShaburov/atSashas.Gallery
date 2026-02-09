import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import '@/pages/public/header/Header.css';
import { InstagramLink } from '@/pages/public/header/headerComponents/instagram/InstagramLink';
import Logo from '@/pages/public/header/headerComponents/Logo';
import Menu from '@/pages/public/header/headerComponents/menuButton/Menu';
import ThemeSwitcher from '@/pages/public/header/headerComponents/themeSwitcher/ThemeSwitcher';
export default function Header() {
    return (_jsxs("div", { className: "headerContainer", children: [_jsx(Menu, {}), _jsx(Logo, {}), _jsx(ThemeSwitcher, {}), _jsx(InstagramLink, {})] }));
}
