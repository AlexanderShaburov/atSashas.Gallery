// features/admin/shared/ui/BlockPreview/SlotCaptionEditor.tsx
//
// Inline caption authoring for a populated gallery slot in the Block
// Editor. Restores the editing path that was disconnected during the
// recent editor migrations.
//
// Data model (unchanged):
//   GalleryArtItem.caption: Localized — the CONTENT (this component edits it).
//   BlockAppearance.slots[pos].caption — the PRESENTATION (handled by
//     BlockCustomizer's CaptionControls).
//
// Wiring: piggybacks on the existing inline-edit infrastructure
// (InlineEditableText + EditTarget + isEditingTarget). The
// BlockEditorSession's `currentTarget` machinery and the
// `imageCaption` hit kind are already in place; this component is
// the consumer that was missing.

import type { GalleryBlock, ItemPosition } from '@/entities/block';
import { Hit } from '@/entities/block';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';

import { InlineEditableText } from './InlineEditableText';

type Props = {
    block: GalleryBlock;
    position: ItemPosition;
};

export function SlotCaptionEditor({ block, position }: Props) {
    const session = useBlockEditorSession();

    const item = block.items.find((it) => it.position === position);
    if (!item || item.kind !== 'art') return null;

    const currentText = item.caption?.en ?? '';

    const target = {
        blockKind: 'gallery' as const,
        kind: 'imageCaption' as const,
        slot: position,
    };

    const handleCommit = (next: string | undefined) => {
        const trimmed = (next ?? '').trim();

        const updatedItems = block.items.map((it) => {
            if (it.position !== position || it.kind !== 'art') return it;
            if (trimmed.length === 0) {
                // Remove caption entirely when cleared so the customizer's
                // `hasText` gate (item.caption?.en) returns false.
                const { caption: _drop, ...rest } = it;
                return rest as typeof it;
            }
            return { ...it, caption: { ...(it.caption ?? {}), en: trimmed } };
        });

        session.setDraft({ ...block, items: updatedItems });
    };

    return (
        <InlineEditableText
            block={block}
            target={target}
            currentTextValue={currentText}
            className="blk-slot-caption blk-slot-caption--editor"
            hit={Hit.galleryCaption(position)}
            onCommit={handleCommit}
        >
            {(props) => (
                <span
                    {...props}
                    onClick={(e) => {
                        // Don't bubble to the slot-image click handler, which
                        // would dispatch the art-pick journey instead of
                        // entering caption-edit mode.
                        e.stopPropagation();
                        props.onClick(e);
                    }}
                >
                    {currentText || (
                        <span className="blk-slot-caption__placeholder">+ Add caption</span>
                    )}
                </span>
            )}
        </InlineEditableText>
    );
}
