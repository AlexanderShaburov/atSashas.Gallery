import type {
    BlockAppearance,
    BlockCaptionAppearance,
    CaptionStyle,
    GalleryBlock,
    ItemPosition,
    SlotCaptionAppearance,
} from '@/entities/block';
import {
    defaultBlockCaptionAppearance,
    defaultSlotCaptionAppearance,
    MAX_FONT_SIZE,
    MIN_FONT_SIZE,
} from '@/entities/block';

import './CaptionControls.css';
import { ColorPicker } from './ColorPicker';
import { FontPicker } from './FontPicker';

type Props = {
    block: GalleryBlock;
    appearance: BlockAppearance;
    onChange: (app: BlockAppearance) => void;
    slotPositions: readonly ItemPosition[];
};

function StyleEditor({
    style,
    onChange,
}: {
    style: CaptionStyle;
    onChange: (s: CaptionStyle) => void;
}) {
    return (
        <div className="ccap__style">
            <FontPicker value={style.font} onChange={(font) => onChange({ ...style, font })} />
            <label className="ccap__size">
                <span>{style.size}px</span>
                <input
                    type="range"
                    min={MIN_FONT_SIZE}
                    max={MAX_FONT_SIZE}
                    value={style.size}
                    onChange={(e) => onChange({ ...style, size: Number(e.target.value) })}
                />
            </label>
            <ColorPicker value={style.color} onChange={(color) => onChange({ ...style, color })} />
        </div>
    );
}

export function CaptionControls({ block, appearance, onChange, slotPositions }: Props) {
    const hasBlockCaption = Boolean(block.caption?.en);

    const handleBlockCaptionChange = (update: Partial<BlockCaptionAppearance>) => {
        const current = appearance.blockCaption ?? defaultBlockCaptionAppearance();
        onChange({ ...appearance, blockCaption: { ...current, ...update } });
    };

    const handleSlotCaptionToggle = (pos: ItemPosition) => {
        const slot = appearance.slots[pos];
        if (!slot) return;
        const current: SlotCaptionAppearance = slot.caption ?? defaultSlotCaptionAppearance();
        onChange({
            ...appearance,
            slots: {
                ...appearance.slots,
                [pos]: { ...slot, caption: { ...current, visible: !current.visible } },
            },
        });
    };

    const handleSlotCaptionStyle = (pos: ItemPosition, style: CaptionStyle) => {
        const slot = appearance.slots[pos];
        if (!slot) return;
        const current: SlotCaptionAppearance = slot.caption ?? defaultSlotCaptionAppearance();
        onChange({
            ...appearance,
            slots: {
                ...appearance.slots,
                [pos]: { ...slot, caption: { ...current, style } },
            },
        });
    };

    const blockCap = appearance.blockCaption ?? defaultBlockCaptionAppearance();

    return (
        <div className="ccap">
            {/* Block caption */}
            {hasBlockCaption && (
                <fieldset className="ccap__section">
                    <legend className="ccap__legend">Block caption</legend>
                    <div className="ccap__row">
                        <span className="ccap__label">Position</span>
                        <div className="cpnl__btn-group">
                            <button
                                type="button"
                                className={`cpnl__btn ${blockCap.position === 'above' ? 'cpnl__btn--active' : ''}`}
                                onClick={() => handleBlockCaptionChange({ position: 'above' })}
                            >
                                above
                            </button>
                            <button
                                type="button"
                                className={`cpnl__btn ${blockCap.position === 'below' ? 'cpnl__btn--active' : ''}`}
                                onClick={() => handleBlockCaptionChange({ position: 'below' })}
                            >
                                below
                            </button>
                        </div>
                    </div>
                    <StyleEditor
                        style={blockCap.style}
                        onChange={(style) => handleBlockCaptionChange({ style })}
                    />
                </fieldset>
            )}

            {/* Per-slot captions */}
            {slotPositions.map((pos) => {
                const slot = appearance.slots[pos];
                if (!slot) return null;
                const item = block.items.find((i) => i.position === pos);
                const hasText = item && item.kind === 'art' && Boolean(item.caption?.en);
                const caption = slot.caption ?? defaultSlotCaptionAppearance();

                return (
                    <fieldset key={pos} className="ccap__section">
                        <legend className="ccap__legend">Slot: {pos}</legend>
                        <label className="ccap__toggle">
                            <input
                                type="checkbox"
                                checked={caption.visible}
                                onChange={() => handleSlotCaptionToggle(pos)}
                                disabled={!hasText}
                            />
                            <span>Show caption{!hasText ? ' (no text)' : ''}</span>
                        </label>
                        {caption.visible && hasText && (
                            <StyleEditor
                                style={caption.style}
                                onChange={(style) => handleSlotCaptionStyle(pos, style)}
                            />
                        )}
                    </fieldset>
                );
            })}
        </div>
    );
}
