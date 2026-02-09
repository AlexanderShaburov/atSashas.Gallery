import { jsx as _jsx } from "react/jsx-runtime";
export function NewStreamComponent({ createNewStream }) {
    function handleOnClick() {
        console.log(`Create new stream placeholder clicked`);
        createNewStream();
    }
    return (_jsx("figure", { className: "se__thumbnail se__thumbnail--create", role: "button", onClick: handleOnClick, "aria-label": "Create new stream", children: _jsx("figcaption", { children: "New Stream" }) }));
}
