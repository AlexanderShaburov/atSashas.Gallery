import { GALLERY_FONTS } from '@/shared/lib/fonts/galleryFonts';
import { loadGoogleFont } from '@/shared/lib/fonts/loadGoogleFont';

type Props = {
    value: string;
    onChange: (font: string) => void;
};

export function FontPicker({ value, onChange }: Props) {
    return (
        <select
            className="cpnl__select"
            value={value}
            onChange={(e) => {
                loadGoogleFont(e.target.value);
                onChange(e.target.value);
            }}
        >
            {GALLERY_FONTS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: `'${f}', serif` }}>
                    {f}
                </option>
            ))}
        </select>
    );
}
