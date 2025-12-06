// src/features/admin/blocks/BlockEditor/BlockKindSelector.tsx

import type { BlockKind } from '@/entities/block';
import '@/features/admin/blocks/ui/BlockPreview/index';

type Props = {
    value: BlockKind | undefined;
    onChange: (kind: BlockKind) => void;
};

// Simple hard-coded options for the first iteration
const BLOCK_KIND_OPTIONS: { value: BlockKind; label: string }[] = [
    { value: 'gallery' as BlockKind, label: 'Gallery' },
    { value: 'text' as BlockKind, label: 'Text' },
    { value: 'cta' as BlockKind, label: 'CTA' },
];

export function BlockKindSelector({ value, onChange }: Props) {
    return (
        <div className="block-kind-selector">
            <label className="block-editor__section-title">Block kind</label>

            {BLOCK_KIND_OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    className={
                        'blocks-page__mode-btn ' +
                        (value === opt.value ? ' blocks-page__mode-btn--active' : '')
                    }
                    onClick={() => onChange(opt.value)}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
