import { SITE_COLOR_PALETTE } from '@/shared/lib/colors/siteColorPalette';

import './ColorPicker.css';

type Props = { value: string; onChange: (color: string) => void };

export function ColorPicker({ value, onChange }: Props) {
    return (
        <div className="clrp">
            <div className="clrp__swatches">
                {SITE_COLOR_PALETTE.map((c) => (
                    <button
                        key={c.value}
                        type="button"
                        className={`clrp__swatch ${value === c.value ? 'clrp__swatch--active' : ''}`}
                        style={{ background: c.value }}
                        title={c.label}
                        onClick={() => onChange(c.value)}
                    />
                ))}
            </div>
            <input
                type="color"
                className="clrp__free"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
