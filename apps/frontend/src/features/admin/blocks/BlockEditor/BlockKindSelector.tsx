// src/features/admin/blocks/BlockEditor/BlockKindSelector.tsx

import type { BlockKind } from '@/entities/block';

type Props = {
    value: BlockKind | undefined;
    onChange: (kind: BlockKind) => void;
};

// Simple hard-coded options for the first iteration
const BLOCK_KIND_OPTIONS: { value: BlockKind; label: string }[] = [
    { value: 'gallery' as BlockKind, label: 'Gallery' },
    { value: 'text' as BlockKind, label: 'Text' },
    { value: 'cta' as BlockKind, label: 'Call to action' },
];

export function BlockKindSelector({ value, onChange }: Props) {
    return (
        <div className="block-kind-selector">
            {BLOCK_KIND_OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    className={
                        'block-kind-selector__btn' +
                        (value === opt.value ? ' block-kind-selector__btn--active' : '')
                    }
                    onClick={() => onChange(opt.value)}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
