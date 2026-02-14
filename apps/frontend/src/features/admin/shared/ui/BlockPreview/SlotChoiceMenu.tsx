// features/admin/shared/ui/BlockPreview/SlotChoiceMenu.tsx

import './SlotChoiceMenu.css';

type Props = {
    top: number;
    left: number;
    onChooseArt: () => void;
    onChooseEvent: () => void;
    onClose: () => void;
};

export function SlotChoiceMenu({ top, left, onChooseArt, onChooseEvent, onClose }: Props) {
    return (
        <div className="slot-choice-backdrop" onMouseDown={onClose}>
            <div
                className="slot-choice-menu"
                style={{ top, left }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <button className="slot-choice-menu__item" onClick={onChooseArt}>
                    Art
                </button>
                <button className="slot-choice-menu__item" onClick={onChooseEvent}>
                    Event
                </button>
            </div>
        </div>
    );
}
