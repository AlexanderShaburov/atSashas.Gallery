import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './ScreenHeaderRow.css';
export function ScreenHeaderRow({ left, right, className }) {
    return (_jsxs("div", { className: `shr ${className ?? ''}`, children: [_jsx("div", { className: "shr__lift", children: left }), _jsx("div", { className: "shr__right", children: right })] }));
}
