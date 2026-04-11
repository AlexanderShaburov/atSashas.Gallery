// EditorWorkspaceContext.tsx
//
// Wave 1 migration: EditorWorkspaceProvider → AdminDataPreloader
// The god-context is replaced by external stores (shared/state/domain/).
// This file now provides:
//   1. AdminDataPreloader – thin wrapper that loads data into stores on mount
//   2. EditorWorkspaceProvider – kept as alias for AdminDataPreloader (router compat)

import { refreshBlocksCollection } from '@/features/admin/blocks/api/blocksApi';
import { refreshCatalog } from '@/features/admin/catalogEditor/api';
import { refreshMediaItems } from '@/features/admin/mediaEditor/api/mediaItemsAdminApi';
import { refreshStreamsIndex } from '@/features/admin/streams/api/streamsApi';

import { type ReactNode, useEffect } from 'react';

interface Props {
    children: ReactNode;
}

/**
 * Thin preloader that populates domain stores on mount.
 * No context, no state – just a side-effect wrapper.
 */
export function AdminDataPreloader({ children }: Props) {
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            await Promise.all([refreshCatalog(), refreshBlocksCollection(), refreshStreamsIndex(), refreshMediaItems()]);
            if (cancelled) return;
            console.log('[AdminDataPreloader]: All domain stores populated');
        };

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    return <>{children}</>;
}

/** Backward-compatible alias so router.tsx doesn't need to change yet */
export const EditorWorkspaceProvider = AdminDataPreloader;
