import { useBlockEditorSession } from '@/features/admin/blocks/hooks/useBlocksEditor';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import type { BlockEditorSession } from '@/features/admin/blocks/editorSession';
import type { EditorWorkspaceContextValue } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import type { GalleryBlock } from '@/entities/block';
import type { ArtItemJSON } from '@/entities/catalog'; // имя поправь под своё

export function GalleryComponent() {
    const ctx: BlockEditorSession = useBlockEditorSession();
    const gCtx: EditorWorkspaceContextValue = useEditorWorkspace();

    const currentBlock = ctx.identity as GalleryBlock;
    const imgPositions = ITEM_POSITIONS[currentBlock.layout];

    // Guard: если нет позиций или каталога — ничего не рисуем
    if (!imgPositions || !gCtx.currentArtCatalog) {
        return null;
    }

    const catalogItems = gCtx.currentArtCatalog.items;

    return (
        <figure className={`gc-block-${ctx.identity?.blockKind}`}>
            {imgPositions.map((pos) => {
                const blockItem = currentBlock.items.find((item) => item.position === pos);
                const imgId = blockItem?.artId;

                if (!imgId) {
                    // Empty slot for this position
                    return (
                        <div
                            key={pos}
                            className={`gc-slot gc-slot-empty gc-slot-${pos.toLowerCase()}`}
                            role="button"
                            onClick={() => positionClicked(pos)}
                        />
                    );
                }

                const img = catalogItems[imgId] as ArtItemJSON | undefined;
                if (!img) {
                    // Art not found in catalog (defensive)
                    return (
                        <div
                            key={`${imgId}-${pos}`}
                            className={`gc-slot gc-slot-missing gc-slot-${pos.toLowerCase()}`}
                            role="button"
                            onClick={() => positionClicked(pos)}
                        >
                            Missing art: {imgId}
                        </div>
                    );
                }

                return (
                    <picture
                        key={img.id ?? `${imgId}-${pos}`}
                        role="button"
                        className={`gc-slot gc-slot-${pos.toLowerCase()}`}
                        onClick={() => positionClicked(pos)}
                    >
                        {/* Replace src/alt with your real fields from ArtItemJSON */}
                        <img src={img.previewSrc ?? img.fullSrc} alt={img.title?.en ?? ''} />
                    </picture>
                );
            })}
        </figure>
    );
}
