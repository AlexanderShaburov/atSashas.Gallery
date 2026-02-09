import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function BlockWrapper({ threeDotMenu, children }) {
    return (_jsxs("div", { className: "bw", children: [_jsx("button", { type: "button", className: "bw__threeDot", onClick: (e) => threeDotMenu.toggle(e.currentTarget), children: "\u22EF" }), children] }));
}
