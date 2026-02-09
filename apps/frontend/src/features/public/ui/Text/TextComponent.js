import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function TextComponent({ block }) {
    const { title, body, variant } = block;
    return (_jsxs("div", { className: `block note ${variant ?? 'full'}`, children: [title?.en && _jsx("h3", { children: title.en }), body?.en && _jsx("p", { children: body.en })] }));
}
