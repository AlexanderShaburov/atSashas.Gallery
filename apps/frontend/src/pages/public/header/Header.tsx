import '@/pages/public/header/Header.css';
import { InstagramLink } from '@/pages/public/header/headerComponents/instagram/InstagramLink';
import Logo from '@/pages/public/header/headerComponents/Logo';
import Menu from '@/pages/public/header/headerComponents/menuButton/Menu';
import ThemeSwitcher from '@/pages/public/header/headerComponents/themeSwitcher/ThemeSwitcher';

export default function Header() {
    return (
        <div className="headerContainer">
            <Menu />
            <Logo />
            <ThemeSwitcher />
            <InstagramLink />
        </div>
    );
}
