import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
export default function Lightbox({ src, alt = '', onClose }) {
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [onClose]);
    return createPortal(_jsx("div", { className: "lb-backdrop", role: "dialog", "aria-modal": "true", onClick: onClose, children: _jsx("img", { className: "lb-img", src: src, alt: alt, onClick: onClose }) }), document.body);
}
