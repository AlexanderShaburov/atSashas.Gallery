import type { AspectRatioPreset, BlockAppearance, GalleryLayout, ItemPosition } from '@/entities/block';
import { ASPECT_RATIO_PRESETS, defaultBlockAppearance, formatAspectRatio, MAX_GAP, MIN_GAP } from '@/entities/block';

import './ControlPanel.css';

type Props = {
    appearance: BlockAppearance;
    layout: GalleryLayout;
    onChange: (app: BlockAppearance) => void;
    onSnapSlot: (pos: ItemPosition) => void;
    slotPositions: readonly ItemPosition[];
};

const ALIGN_OPTIONS = ['top', 'center', 'bottom'] as const;

export function ControlPanel({ appearance, layout, onChange, onSnapSlot, slotPositions }: Props) {
    const handleGapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...appearance, gap: Number(e.target.value) });
    };

    const handleAlignChange = (align: 'top' | 'center' | 'bottom') => {
        onChange({ ...appearance, verticalAlign: align });
    };

    const handleAspectRatioChange = (preset: AspectRatioPreset) => {
        onChange({ ...appearance, aspectRatio: preset.value });
    };

    const handleReset = () => {
        onChange(defaultBlockAppearance(layout));
    };

    return (
        <div className="cpnl">
            {/* Aspect ratio presets */}
            <fieldset className="cpnl__field">
                <legend className="cpnl__label">Canvas {formatAspectRatio(appearance.aspectRatio)}</legend>
                <div className="cpnl__btn-group cpnl__btn-group--wrap">
                    {ASPECT_RATIO_PRESETS.map((preset) => {
                        const isActive =
                            appearance.aspectRatio === preset.value ||
                            (typeof appearance.aspectRatio === 'number' &&
                                typeof preset.value === 'number' &&
                                Math.abs(appearance.aspectRatio - preset.value) < 0.001);
                        return (
                            <button
                                key={preset.label}
                                type="button"
                                className={`cpnl__btn ${isActive ? 'cpnl__btn--active' : ''}`}
                                onClick={() => handleAspectRatioChange(preset)}
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>
            </fieldset>

            {/* Gap slider */}
            <label className="cpnl__field">
                <span className="cpnl__label">Gap: {appearance.gap}px</span>
                <input
                    type="range"
                    min={MIN_GAP}
                    max={MAX_GAP}
                    value={appearance.gap}
                    onChange={handleGapChange}
                    className="cpnl__slider"
                />
            </label>

            {/* Vertical align */}
            <fieldset className="cpnl__field">
                <legend className="cpnl__label">Vertical align</legend>
                <div className="cpnl__btn-group">
                    {ALIGN_OPTIONS.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            className={`cpnl__btn ${appearance.verticalAlign === opt ? 'cpnl__btn--active' : ''}`}
                            onClick={() => handleAlignChange(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </fieldset>

            {/* Snap to natural per slot */}
            <fieldset className="cpnl__field">
                <legend className="cpnl__label">Reset slot zoom/pan</legend>
                <div className="cpnl__btn-group">
                    {slotPositions.map((pos) => (
                        <button
                            key={pos}
                            type="button"
                            className="cpnl__btn"
                            onClick={() => onSnapSlot(pos)}
                        >
                            {pos}
                        </button>
                    ))}
                </div>
            </fieldset>

            {/* Reset */}
            <button type="button" className="cpnl__btn cpnl__btn--danger" onClick={handleReset}>
                Reset all to defaults
            </button>
        </div>
    );
}
