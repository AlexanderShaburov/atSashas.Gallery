// src/assets/icons/MenuIcon.jsx
import MenuIcon from "./MenuIcon";
import "./menuButton.css";

function ShowMenu() {
  return <h1>Menu</h1>;
}

export default function MenuButton() {
  return (
    <button
      type="button"
      aria-label="menu button"
      className="btn menuButton"
      onClick={ShowMenu}
    >
      <MenuIcon size={25} />
    </button>
  );
}
