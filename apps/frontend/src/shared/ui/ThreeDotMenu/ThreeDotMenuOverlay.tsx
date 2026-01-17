// src/shared/ui/ThreeDotMenu/ThreeDotMenuOverlay.tsx
import type { ThreeDotAction, ThreeDotOwner } from './threeDot.types';
import './ThreeDotMenuOverlay.css';

export type ThreeDotMenuItem = {
    key: string;
    label: string;
    action: ThreeDotAction;
    danger?: boolean;
    disabled?: boolean;
};

export function ThreeDotMenuOverlay(props: {
    isOpen: boolean;
    owner: ThreeDotOwner | null;
    anchorRect: DOMRect | null;
    items: ThreeDotMenuItem[];
    onSelect: (action: ThreeDotAction) => void;
    onClose: () => void;
}) {
    if (!props.isOpen || !props.anchorRect) return null;

    const r = props.anchorRect;

    return (
        <div className="tdm__backdrop" onMouseDown={props.onClose}>
            <div
                className="tdm__menu"
                style={{ position: 'fixed', top: r.top + r.height, left: r.left + r.width }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {props.items.map((it) => (
                    <button
                        key={it.key}
                        className={`tdm__item ${it.danger ? 'tdm__item--danger' : ''}`}
                        disabled={it.disabled}
                        onClick={() => props.onSelect(it.action)}
                    >
                        {it.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
