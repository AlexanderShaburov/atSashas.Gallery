// UX/AutocompleteInput.tsx — Custom autocomplete replacing native <datalist>

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
    id: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export default function AutocompleteInput({ id, value, options, onChange, placeholder, className }: Props) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const filtered = value
        ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase()) && o !== value)
        : options;

    const show = open && filtered.length > 0;

    const pick = useCallback(
        (val: string) => {
            onChange(val);
            setOpen(false);
            setActiveIndex(-1);
        },
        [onChange],
    );

    const onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!show) return;
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setActiveIndex((i) => (i + 1) % filtered.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setActiveIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
                    break;
                case 'Enter': {
                    e.preventDefault();
                    const item = filtered[activeIndex];
                    if (item !== undefined) pick(item);
                    break;
                }
                case 'Escape':
                    setOpen(false);
                    setActiveIndex(-1);
                    break;
            }
        },
        [show, filtered, activeIndex, pick],
    );

    // Scroll active item into view
    useEffect(() => {
        if (activeIndex < 0 || !listRef.current) return;
        const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={wrapRef} className="ac-wrap">
            <input
                id={id}
                type="text"
                className={className}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                    setActiveIndex(-1);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                autoComplete="off"
                role="combobox"
                aria-expanded={show}
                aria-autocomplete="list"
                aria-controls={`${id}-listbox`}
                aria-activedescendant={activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
            />
            {show && (
                <ul
                    ref={listRef}
                    id={`${id}-listbox`}
                    className="ac-listbox"
                    role="listbox"
                >
                    {filtered.map((opt, i) => (
                        <li
                            key={opt}
                            id={`${id}-opt-${i}`}
                            role="option"
                            aria-selected={i === activeIndex}
                            className={'ac-option' + (i === activeIndex ? ' ac-option--active' : '')}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                pick(opt);
                            }}
                        >
                            {opt}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
