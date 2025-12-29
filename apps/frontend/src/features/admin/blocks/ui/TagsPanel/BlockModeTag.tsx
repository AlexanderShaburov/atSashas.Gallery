// src/features/admin/blocks/BlockEditor/BlockModeTag.tsx

import type { BlockEditorMode } from '@/features/admin/blocks/editorSession/block-editor.types';

type Props = {
    mode: BlockEditorMode;
    dirty: boolean;
    valid: boolean;
    saving: boolean;
    hasIdentity: boolean;
};

export function BlockModeTag({ mode, dirty, valid, saving, hasIdentity }: Props) {
    const modeLabel = mode === 'create' ? 'Create block' : 'Edit block';
    const statusParts: string[] = [];

    if (saving) {
        statusParts.push('saving…');
    } else if (dirty) {
        statusParts.push('unsaved changes');
    } else {
        statusParts.push('up to date');
    }

    if (!valid && dirty) {
        statusParts.push('invalid');
    }

    if (mode === 'edit' && !hasIdentity) {
        statusParts.push('no block selected');
    }

    const status = statusParts.join(' • ');

    return (
        <div className="block-mode-tag">
            <span className="block-mode-tag__mode">{modeLabel}</span>
            <span className="block-mode-tag__status">{status}</span>
        </div>
    );
}
