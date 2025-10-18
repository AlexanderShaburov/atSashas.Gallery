/* eslint-disable no-unused-vars */
import { useTheme } from "../../../lib/theme/ThemeContext";
import { SunIcon } from "./SunIcon";
import { MoonIcon } from "./MoonIcon";
import "./themeSwitcher.css";

export default function ThemeSwitcher() {
  const { theme, mode, toggle, setLight, setDark, setSystem } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className="btn themeSwitcherButton"
      onClick={toggle}
    >
      {theme === "dark" ? <SunIcon size={24} /> : <MoonIcon size={24} />}
    </button>
  );
}
