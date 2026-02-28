// src/features/admin/catalogEditor/hooks/useDependencyAwareDeletion.ts

import type { ArtItem } from '@/entities/art';
import { deleteBlock, refreshBlocksCollection } from '@/features/admin/blocks/api/blocksApi';
import { deleteArtItem as deleteArtItemApi, refreshCatalog } from '@/features/admin/catalogEditor/api';
import { useJourneyGuard } from '@/features/admin/shared/hooks/useJourneyGuard';
import { useDispatch } from '@/features/admin/shared/transporter/transporter';
import { refreshStreamsIndex, streamsApi } from '@/features/admin/streams/api/streamsApi';
import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { dependencyResolver } from '@/shared/lib/dependencies';
import { generateId } from '@/shared/lib/id/generateId';
import type { JourneyHome, JourneyTicket } from '@/shared/nav';
import { destructiveActionsStore } from '@/shared/state/destructiveActions.store';
import { blocksCollectionStore, streamsIndexStore } from '@/shared/state/domain';
import { useCallback } from 'react';

/**
 * Hook that provides dependency-aware deletion for art items
 * Handles checking dependencies, showing resolution UI, and cascade deletion
 */
export function useDependencyAwareDeletion(options?: { onRefresh?: () => Promise<void> }) {
    const dispatch = useDispatch();
    const { canStartDeletion } = useJourneyGuard('catalog');

    /**
     * Delete an art item with dependency checking
     */
    const deleteArtItem = useCallback(
        async (artItem: ArtItem) => {
            console.log(
                `[useDependencyAwareDeletion]: Attempting to delete art item ${artItem.data.id}`,
            );

            // STEP 1: Check if journey is active
            const guardResult = canStartDeletion();
            if (!guardResult.allowed) {
                alert(guardResult.reason);
                return;
            }

            // STEP 2: Analyze dependencies
            try {
                const depTree = await dependencyResolver.buildArtItemDependencyTree(
                    artItem.data.id,
                    artItem.data.title?.en || artItem.data.title?.ru || 'Untitled',
                    blocksCollectionStore.get()!,
                    streamsIndexStore.get() || [],
                    streamsApi.get,
                );

                console.log(`[useDependencyAwareDeletion]: Dependency tree:`, depTree);

                // STEP 3: If no dependencies, simple delete
                if (depTree.dependents.length === 0) {
                    destructiveActionsStore.open({
                        title: 'Delete Art Item',
                        message: `Delete "${artItem.data.title?.en || artItem.data.id}"? No dependencies found.`,
                        resolutionMode: 'simple',
                        confirmLabel: 'Delete',
                        run: async () => {
                            await deleteArtItemApi(artItem.data.id);
                        },
                        onSuccess: async () => {
                            console.log(
                                `[useDependencyAwareDeletion]: Art item deleted successfully`,
                            );
                            // Refresh catalog store
                            await refreshCatalog();
                            if (options?.onRefresh) {
                                await options.onRefresh();
                            }
                        },
                    });
                    return;
                }

                // STEP 4: Has dependencies - show resolution options
                destructiveActionsStore.open({
                    title: `Delete "${artItem.data.title?.en || artItem.data.id}"`,
                    message: `This art item is used in ${depTree.dependents.length} place${depTree.dependents.length !== 1 ? 's' : ''}. Choose how to proceed:`,
                    resolutionMode: 'manual',
                    dependencies: depTree,

                    // Manual resolution: navigate to dependency
                    onNavigateToDependency: (dep) => {
                        console.log(`[useDependencyAwareDeletion]: Navigating to dependency`, dep);

                        // Close overlay
                        destructiveActionsStore.close();

                        // Create journey ticket to navigate to dependent editor
                        const home: JourneyHome = {
                            editor: 'catalog',
                            objectId: artItem.data.id,
                        };

                        const ticket: JourneyTicket = {
                            journeyId: generateId('travel'),
                            destination: {
                                editor: dep.kind === 'stream' ? 'stream' : 'block',
                                mode: 'edit',
                                objectId: dep.id,
                            },
                            returnTo: {
                                editor: 'catalog',
                                mode: 'edit',
                                objectId: artItem.data.id,
                            },
                            phase: 'outbound',
                            returnEffect: {
                                kind: 'dependencyResolved',
                                targetId: artItem.data.id,
                            },
                            nonce: createNonce(),
                            createdAt: nowIso(),
                        };

                        dispatch(ticket, home);
                    },

                    // Cascade delete: delete everything
                    onCascadeDelete: async () => {
                        console.log(`[useDependencyAwareDeletion]: Starting cascade delete`);
                        const cascade = depTree.cascadePreview!;

                        // Delete in correct order: streams → blocks → artItem

                        // 1. Load all affected streams
                        const streamPromises = cascade.streams.map((sid) => streamsApi.get(sid));
                        const streams = await Promise.all(streamPromises);

                        // 2. Process each stream
                        for (const stream of streams) {
                            // Remove blocks from stream
                            const filtered = stream.blockIds.filter(
                                (bid) => !cascade.blocks.includes(bid),
                            );

                            if (filtered.length === 0) {
                                // Stream is empty, delete it
                                console.log(
                                    `[useDependencyAwareDeletion]: Deleting empty stream ${stream.streamId}`,
                                );
                                await streamsApi.remove(stream.streamId);
                            } else {
                                // Update stream without deleted blocks
                                console.log(
                                    `[useDependencyAwareDeletion]: Updating stream ${stream.streamId}`,
                                );
                                await streamsApi.update({ ...stream, blockIds: filtered });
                            }
                        }

                        // 3. Delete blocks
                        for (const blockId of cascade.blocks) {
                            console.log(`[useDependencyAwareDeletion]: Deleting block ${blockId}`);
                            await deleteBlock(blockId);
                        }

                        // 4. Finally delete artItem
                        console.log(
                            `[useDependencyAwareDeletion]: Deleting art item ${artItem.data.id}`,
                        );
                        await deleteArtItemApi(artItem.data.id);
                    },

                    onSuccess: async () => {
                        console.log(`[useDependencyAwareDeletion]: Cascade delete completed`);
                        // Refresh all relevant data
                        await Promise.all([
                            refreshCatalog(),
                            refreshBlocksCollection(),
                            refreshStreamsIndex(),
                        ]);
                        if (options?.onRefresh) {
                            await options.onRefresh();
                        }
                    },
                });
            } catch (err) {
                console.error(`[useDependencyAwareDeletion]: Error analyzing dependencies:`, err);
                alert(`Failed to analyze dependencies: ${err}`);
                destructiveActionsStore.close();
            }
        },
        [dispatch, canStartDeletion, options],
    );

    return { deleteArtItem };
}
