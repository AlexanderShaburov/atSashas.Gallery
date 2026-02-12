// src/shared/ArtCatalogProvider/useResolveArtAdaptive.ts
import { ArtItemData } from '@/entities/art';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { useResolveArt } from '@/shared/ArtCatalogProvider/CatalogHook';

export type ResolveArt = (id: string) => ArtItemData | undefined;

/**
 * Adaptive hook that resolves art items from the correct catalog source:
 * - In admin/editor context: uses EditorWorkspaceContext.currentArtCatalog (dynamically updated)
 * - In public context: uses ArtCatalogContext (static, loaded once)
 *
 * This fixes the issue where newly created art items weren't visible in the Block editor
 * because GalleryComponent was reading from the stale ArtCatalogContext instead of the
 * updated EditorWorkspaceContext.
 */
export function useResolveArtAdaptive(): ResolveArt {
    // Try to get editor workspace context (only available in admin area)
    let editorWorkspace;
    try {
        editorWorkspace = useEditorWorkspace();
    } catch {
        // Not in editor workspace, will fall back to public catalog
        editorWorkspace = undefined;
    }

    // Fallback: public catalog context (from ArtCatalogLoader)
    const publicResolveArt = useResolveArt();

    // If in editor workspace and it has a catalog, use that (it's dynamically updated)
    if (editorWorkspace?.currentArtCatalog) {
        return (artId: string) => editorWorkspace.currentArtCatalog!.items[artId];
    }

    // Otherwise use public catalog (public pages or editor workspace not initialized yet)
    return publicResolveArt;
}
