import MenuIcon from '@/shared/header/headerComponents/menuButton/MenuIcon';
import '@/shared/header/headerComponents/menuButton/menuButton.css';

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
