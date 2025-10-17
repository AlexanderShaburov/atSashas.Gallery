import './header.css';
import { InstagramLink } from './headerComponents/instagram/InstagramLink';
import Logo from './headerComponents/Logo';
import Menu from './headerComponents/menuButton/Menu';
import ThemeSwitcher from './headerComponents/themeSwitcher/ThemeSwitcher';

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
