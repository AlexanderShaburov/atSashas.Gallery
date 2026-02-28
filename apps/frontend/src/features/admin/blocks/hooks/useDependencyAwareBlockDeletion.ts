// src/features/admin/blocks/hooks/useDependencyAwareBlockDeletion.ts

import { useCallback } from 'react';
import type { Block } from '@/entities/block';
import { refreshBlocksCollection } from '@/features/admin/blocks/api/blocksApi';
import { refreshStreamsIndex } from '@/features/admin/streams/api/streamsApi';
import { useDispatch } from '@/features/admin/shared/transporter/transporter';
import { useJourneyGuard } from '@/features/admin/shared/hooks/useJourneyGuard';
import { dependencyResolver } from '@/shared/lib/dependencies';
import { destructiveActionsStore } from '@/shared/state/destructiveActions.store';
import { streamsIndexStore } from '@/shared/state/domain';
import type { JourneyHome, JourneyTicket } from '@/shared/nav';
import { generateId } from '@/shared/lib/id/generateId';
import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { streamsApi } from '@/features/admin/streams/api/streamsApi';
import { deleteBlock as deleteBlockApi } from '@/features/admin/blocks/api/blocksApi';

/**
 * Hook that provides dependency-aware deletion for blocks
 */
export function useDependencyAwareBlockDeletion() {
    const dispatch = useDispatch();
    const { canStartDeletion } = useJourneyGuard('block');

    /**
     * Delete a block with dependency checking
     */
    const deleteBlock = useCallback(
        async (block: Block) => {
            console.log(`[useDependencyAwareBlockDeletion]: Attempting to delete block ${block.id}`);

            // STEP 1: Check if journey is active
            const guardResult = canStartDeletion();
            if (!guardResult.allowed) {
                alert(guardResult.reason);
                return;
            }

            // STEP 2: Analyze dependencies
            destructiveActionsStore.setPhase('checking-dependencies');

            try {
                const blockTitle =
                    ('title' in block && block.title ? String(block.title) : undefined) ||
                    'Untitled Block';
                const depTree = await dependencyResolver.buildBlockDependencyTree(
                    block.id,
                    blockTitle,
                    streamsIndexStore.get() || [],
                    streamsApi.get,
                );

                console.log(`[useDependencyAwareBlockDeletion]: Dependency tree:`, depTree);

                // STEP 3: If no dependencies, simple delete
                if (depTree.dependents.length === 0) {
                    destructiveActionsStore.open({
                        title: 'Delete Block',
                        message: `Delete "${blockTitle}"? No streams are using this block.`,
                        resolutionMode: 'simple',
                        confirmLabel: 'Delete',
                        run: async () => {
                            await deleteBlockApi(block.id);
                        },
                        onSuccess: () => {
                            console.log(`[useDependencyAwareBlockDeletion]: Block deleted successfully`);
                            refreshBlocksCollection();
                        },
                    });
                    return;
                }

                // STEP 4: Has dependencies - show resolution options
                destructiveActionsStore.open({
                    title: `Delete "${blockTitle}"`,
                    message: `This block is used in ${depTree.dependents.length} stream${depTree.dependents.length !== 1 ? 's' : ''}. Choose how to proceed:`,
                    resolutionMode: 'manual',
                    dependencies: depTree,

                    // Manual resolution: navigate to stream
                    onNavigateToDependency: (dep) => {
                        console.log(`[useDependencyAwareBlockDeletion]: Navigating to dependency`, dep);

                        // Close overlay
                        destructiveActionsStore.close();

                        // Create journey ticket to navigate to stream editor
                        const home: JourneyHome = {
                            editor: 'block',
                            objectId: block.id,
                        };

                        const ticket: JourneyTicket = {
                            journeyId: generateId('travel'),
                            destination: {
                                editor: 'stream',
                                mode: 'edit',
                                objectId: dep.id,
                            },
                            returnTo: {
                                editor: 'block',
                                mode: 'edit',
                                objectId: block.id,
                            },
                            phase: 'outbound',
                            returnEffect: {
                                kind: 'dependencyResolved',
                                targetId: block.id,
                            },
                            nonce: createNonce(),
                            createdAt: nowIso(),
                        };

                        dispatch(ticket, home);
                    },

                    // Cascade delete: remove from all streams
                    onCascadeDelete: async () => {
                        console.log(`[useDependencyAwareBlockDeletion]: Starting cascade delete`);
                        const cascade = depTree.cascadePreview!;

                        // 1. Load all affected streams
                        const streamPromises = cascade.streams.map((sid) => streamsApi.get(sid));
                        const streams = await Promise.all(streamPromises);

                        // 2. Remove block from each stream
                        for (const stream of streams) {
                            const filtered = stream.blockIds.filter((bid) => bid !== block.id);

                            if (filtered.length === 0) {
                                // Stream becomes empty, delete it
                                console.log(`[useDependencyAwareBlockDeletion]: Deleting empty stream ${stream.streamId}`);
                                await streamsApi.remove(stream.streamId);
                            } else {
                                // Update stream without this block
                                console.log(`[useDependencyAwareBlockDeletion]: Updating stream ${stream.streamId}`);
                                await streamsApi.update({ ...stream, blockIds: filtered });
                            }
                        }

                        // 3. Delete the block
                        console.log(`[useDependencyAwareBlockDeletion]: Deleting block ${block.id}`);
                        await deleteBlockApi(block.id);
                    },

                    onSuccess: () => {
                        console.log(`[useDependencyAwareBlockDeletion]: Cascade delete completed`);
                        // Refresh relevant data
                        refreshBlocksCollection();
                        refreshStreamsIndex();
                    },
                });
            } catch (err) {
                console.error(`[useDependencyAwareBlockDeletion]: Error analyzing dependencies:`, err);
                alert(`Failed to analyze dependencies: ${err}`);
                destructiveActionsStore.close();
            }
        },
        [dispatch, canStartDeletion],
    );

    return { deleteBlock };
}
