import { LangCode, Localized } from '@/entities/common';
import { useEffect, useMemo, useState } from 'react';

interface LangInputProps {
    label: string;
    value: Localized | undefined;
    onChange: (next: Localized | undefined) => void;
    availableLangs?: readonly LangCode[];
    initialLang?: LangCode;
    className?: string;
    inputId?: string;
    placeholder?: string;
}

function isEmptyLocalized(obj: Localized | undefined, langs: readonly LangCode[]): boolean {
    if (!obj) return true;
    return langs.every((lc) => !obj[lc] || obj[lc]?.trim() === '');
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
    const [draft, setDraft] = useState<Localized | undefined>(value);

    // keep local draft in sync when parent value changes
    useEffect(() => {
        if (!value) setDraft(value);
    }, [value]);

    // build safe input id
    const fieldId = useMemo(
        () => inputId ?? `${label.replace(/\s+/g, '-').toLowerCase()}-${lang}`,
        [inputId, label, lang],
    );

    function updateLangValue(text: string) {
        const next: Localized = { ...(draft ?? {}), [lang]: text };
        setDraft(next);
        onChange(isEmptyLocalized(next, LANGS) ? undefined : next);
    }

    return (
        <div className={`cf-row cf-lang ${className ?? ''}`}>
            <label htmlFor={fieldId} className="cf-label">
                {label}
            </label>

            <div className="cf-lang-wrap">
                <input
                    id={fieldId}
                    className="cf-input"
                    value={draft?.[lang] ?? ''}
                    placeholder={placeholder}
                    onChange={(e) => updateLangValue(e.target.value)}
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
