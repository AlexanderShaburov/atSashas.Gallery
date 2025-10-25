import '@/shared/header/Header.module.css';
import { InstagramLink } from '@/shared/header/headerComponents/instagram/InstagramLink';
import Logo from '@/shared/header/headerComponents/Logo';
import Menu from '@/shared/header/headerComponents/menuButton/Menu';
import ThemeSwitcher from '@/shared/header/headerComponents/themeSwitcher/ThemeSwitcher';

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
