//LangInput.tsx

import { LangCode, Localized } from '@/entities/common';
import { useState } from 'react';

interface LangInputProps {
    label: string;
    value: Localized | undefined;
    onChange: (next: Localized) => void;
    availableLangs?: readonly LangCode[];
    initialLang?: LangCode;
    className?: string;
    inputId?: string;
    placeholder: string | undefined;
}

export default function LangInput({
    label,
    value,
    onChange,
    availableLangs,
    initialLang = 'en',
    className,
    inputId,
    placeholder,
}: LangInputProps) {
    const LANGS: readonly LangCode[] = availableLangs ?? (['en', 'ru', 'it', 'es', 'pt'] as const);

    const [lang, setLang] = useState<LangCode>(initialLang);

    return (
        <div className={`cf-row cf-lang ${className ?? ''}`}>
            <label htmlFor={inputId} className="cf-label">
                {label}
            </label>

            <div className="cf-lang-wrap">
                <input
                    id={inputId}
                    className="cf-input"
                    value={value?.[lang]}
                    placeholder={placeholder}
                    onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                />
                <select
                    aria-label={`${label} language`}
                    className="cf-select cf-select--lang"
                    value={lang}
                    onChange={(e) => setLang(e.target.value as LangCode)}
                >
                    {LANGS.map((ls) => (
                        <option key={ls} value={ls}>
                            {ls.toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
