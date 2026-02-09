import { jsx as _jsx } from "react/jsx-runtime";
import MenuIcon from './MenuIcon';
import './MenuButton.css';
function ShowMenu() {
    return _jsx("h1", { children: "Menu" });
}
export default function MenuButton() {
    return (_jsx("button", { type: "button", "aria-label": "menu button", className: "btn menuButton", onClick: ShowMenu, children: _jsx(MenuIcon, { size: 25 }) }));
}
