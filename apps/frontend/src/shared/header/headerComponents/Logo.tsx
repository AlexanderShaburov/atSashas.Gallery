import { Link } from 'react-router-dom';
import { ThemeContextValue, useTheme } from '../../lib/theme/ThemeContext';
import logoLight from './images/logo/LogoBlack.png';
import logoDark from './images/logo/LogoWhite.png';

export default function Logo() {
  const currentTheme: ThemeContextValue = useTheme();

  const src = currentTheme.theme === 'dark' ? logoDark : logoLight;

  return (
    <Link to="/" className="logoSign" aria-label="Home">
      <img src={src} alt="logo" height={40} />
    </Link>
  );
}
