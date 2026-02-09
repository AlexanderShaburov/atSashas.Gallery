import { jsx as _jsx } from "react/jsx-runtime";
import './ThreeDotMenuOverlay.css';
export function ThreeDotMenuOverlay(props) {
    if (!props.isOpen || !props.anchorRect)
        return null;
    const r = props.anchorRect;
    return (_jsx("div", { className: "tdm__backdrop", onMouseDown: props.onClose, children: _jsx("div", { className: "tdm__menu", style: { position: 'fixed', top: r.top + r.height, left: r.left + r.width }, onMouseDown: (e) => e.stopPropagation(), children: props.items.map((it) => (_jsx("button", { className: `tdm__item ${it.danger ? 'tdm__item--danger' : ''}`, disabled: it.disabled, onClick: () => props.onSelect(it.action), children: it.label }, it.key))) }) }));
}
