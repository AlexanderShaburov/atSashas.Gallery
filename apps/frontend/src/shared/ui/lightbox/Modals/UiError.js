import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './UiError.css';
export function UiError({ uiError, setUiError, onConfirm }) {
    return (_jsx("div", { className: "modal-overlay", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "modal-card", children: [_jsx("div", { className: "modal-title", children: uiError.title }), _jsx("div", { className: "modal-body", children: uiError.message }), _jsx("div", { className: "modal-actions", children: _jsx("button", { onClick: () => {
                            onConfirm();
                            setUiError(undefined);
                        }, children: "OK" }) })] }) }));
}
