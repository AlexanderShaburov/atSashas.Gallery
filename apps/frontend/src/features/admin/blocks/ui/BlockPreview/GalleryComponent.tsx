import type { ArtItemData } from '@/entities/art';
import { GalleryBlock, GalleryLayout, ItemPosition } from '@/entities/block';
import { BlockEditorSession } from '@/features/admin/blocks/editorSession';
import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import {
    useEditorWorkspace,
    type EditorWorkspaceContextValue,
} from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
const ITEM_POSITIONS: Record<GalleryLayout, ItemPosition[]> = {
    single: ['Center'],
    pairHorizontal: ['Left', 'Right'],
    pairVertical: ['Up', 'Bottom'],
    triptychLeft: ['LS', 'RUC', 'RBC'],
    triptychRight: ['LUC', 'LBC', 'RS'],
    triptychHorizontal: ['Left', 'Center', 'Right'],
};

type Props = {
    item: GalleryBlock;
    onClick: (item: GalleryBlock) => void;
};

export function GalleryComponent({ item, onClick }: Props) {
    const ctx: BlockEditorSession = useBlockEditorSession();
    const gCtx: EditorWorkspaceContextValue = useEditorWorkspace();

    const imgPositions = ITEM_POSITIONS[item.layout];

    return (
        <figure className={`gc-block-${ctx.identity?.blockKind}`}>
            {imgPositions.map((pos) => {
                const blockItem = item.items.find((i) => i.position === pos);
                const imgId = blockItem?.artId;

                if (!imgId) {
                    // Empty slot for this position
                    return (
                        <div
                            key={pos}
                            className={`gc-slot gs-slot-empty gc-slot-${pos.toLowerCase()}`}
                            role="button"
                            onClick={() => onClick}
                        />
                    );
                }

                const img = gCtx.currentArtCatalog?.items[imgId] as ArtItemData | undefined;
                if (!img) {
                    // Art not found in catalog
                    return (
                        <div
                            key={`${imgId}-${pos}`}
                            className={`gc-slot gc-slot-missing gc-slot-${pos.toLowerCase()}`}
                            role="button"
                            onClick={() => onClick(item)}
                        >
                            Missing art: {imgId}
                        </div>
                    );
                }
                return (
                    <picture
                        key={imgId ?? `${imgId}-${pos}`}
                        role="button"
                        className={`gc-slot gc-slot-${pos.toLowerCase()}`}
                        onClick={() => onClick}
                    >
                        <source type="image/avif" srcSet={img.images.preview.avif} />
                        <source type="image/webp" srcSet={img.images.preview.webp} />
                        <img
                            src={img.images.preview.jpeg}
                            alt={img.images.alt.en || ''}
                            loading="lazy"
                        />
                    </picture>
                );
            })}
        </figure>
    );
}
