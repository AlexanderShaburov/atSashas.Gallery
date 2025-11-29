// features/admin/blocks/ui/BlocksEditorShell.tsx

import { useState } from 'react';
import type { Block } from '@/entities/block';
import { LayoutPalette } from './LayoutPalette';
import { BlockPreview } from './BlockPreview';
import { TagsPanel } from './TagsPanel';
import { CatalogPanel } from './CatalogPanel';

type Mode = 'create' | 'edit';

// We duplicate layout keys locally to avoid touching Block.ts for now
const GALLERY_LAYOUTS = [
    'single',
    'pairHorizontal',
    'pairVertical',
    'triptychLeft',
    'triptychRight',
    'triptychHorizontal',
] as const;

type GalleryLayoutKey = (typeof GALLERY_LAYOUTS)[number];

interface BlockDraft {
    layout: GalleryLayoutKey | null;
    tags: string[];
    // In future we can also keep selected artIds here
}

export function BlocksEditorShell() {
    // здесь state: mode, draft, selectedBlock и т.п.
    // тут же подключишь контекст, когда появится

    return (
        <div className="blocks-page">
            {/* header + переключатель Create/Edit */}
            {/* слева LayoutPalette, по центру BlockPreview + TagsPanel, справа CatalogPanel */}
        </div>
    );
}
