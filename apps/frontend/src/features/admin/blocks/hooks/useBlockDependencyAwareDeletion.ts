// src/features/admin/blocks/hooks/useBlockDependencyAwareDeletion.ts

import type { Block } from '@/entities/block';
import { deleteBlock } from '@/features/admin/blocks/api/blocksApi';
import { useEditorWorkspace } from '@/features/admin/EditorWorkspace/EditorWorkspaceContext';
import { useJourneyGuard } from '@/features/admin/shared/hooks/useJourneyGuard';
import { useDispatch, useReturnHome } from '@/features/admin/shared/transporter/transporter';
import { streamsApi } from '@/features/admin/streams/api/streamsApi';
import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { dependencyResolver } from '@/shared/lib/dependencies';
import { generateId } from '@/shared/lib/id/generateId';
import type { JourneyHome, JourneyTicket } from '@/shared/nav';
import { destructiveActionsStore } from '@/shared/state/destructiveActions.store';
import { useCallback } from 'react';

/**
 * Hook that provides dependency-aware deletion for blocks
 * Handles checking stream dependencies, showing resolution UI, and cascade deletion
 */
export function useBlockDependencyAwareDeletion(options?: {
    onRefresh?: () => Promise<void>;
    onComplete?: () => void;
    isInJourney?: boolean;
}) {
    const gCtx = useEditorWorkspace();
    const dispatch = useDispatch();
    const returnHome = useReturnHome();
    const { canStartDeletion } = useJourneyGuard('block');

    /**
     * Delete a block with dependency checking
     */
    const deleteBlockWithDeps = useCallback(
        async (block: Block) => {
            console.log(
                `[useBlockDependencyAwareDeletion]: Attempting to delete block ${block.id}`,
            );

            // STEP 1: Check if journey is active (but allow if we're IN the journey for dependency resolution)
            const guardResult = canStartDeletion();
            if (!guardResult.allowed) {
                alert(guardResult.reason);
                return;
            }

            // STEP 2: Analyze dependencies
            try {
                const depTree = await dependencyResolver.buildBlockDependencyTree(
                    block.id,
                    block.title || block.id,
                    gCtx.streamsIndex || [],
                );

                console.log(`[useBlockDependencyAwareDeletion]: Dependency tree:`, depTree);

                // STEP 3: If no dependencies, simple delete
                if (depTree.dependents.length === 0) {
                    destructiveActionsStore.open({
                        title: 'Delete Block',
                        message: `Delete "${block.title || block.id}"? No dependencies found.`,
                        resolutionMode: 'simple',
                        confirmLabel: 'Delete',
                        run: async () => {
                            await deleteBlock(block.id);
                        },
                        onSuccess: async () => {
                            console.log(
                                `[useBlockDependencyAwareDeletion]: Block deleted successfully`,
                            );
                            // Refresh data
                            await gCtx.refreshBlocks();
                            await gCtx.refreshStreams();
                            if (options?.onRefresh) {
                                await options.onRefresh();
                            }

                            // Handle post-deletion navigation
                            if (options?.isInJourney) {
                                console.log(
                                    `[useBlockDependencyAwareDeletion]: In journey, returning home`,
                                );
                                returnHome('block', { ok: true, id: block.id });
                            } else if (options?.onComplete) {
                                console.log(
                                    `[useBlockDependencyAwareDeletion]: Calling onComplete callback`,
                                );
                                options.onComplete();
                            }
                        },
                    });
                    return;
                }

                // STEP 4: Has dependencies - show resolution options
                destructiveActionsStore.open({
                    title: `Delete "${block.title || block.id}"`,
                    message: `This block is used in ${depTree.dependents.length} stream${depTree.dependents.length !== 1 ? 's' : ''}. Choose how to proceed:`,
                    resolutionMode: 'manual',
                    dependencies: depTree,

                    // Manual resolution: navigate to stream
                    onNavigateToDependency: (dep) => {
                        console.log(
                            `[useBlockDependencyAwareDeletion]: Navigating to dependency`,
                            dep,
                        );

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

                    // Cascade delete: remove from streams and delete block
                    onCascadeDelete: async () => {
                        console.log(`[useBlockDependencyAwareDeletion]: Starting cascade delete`);
                        const cascade = depTree.cascadePreview!;

                        // 1. Load all affected streams
                        const streamPromises = cascade.streams.map((sid) => streamsApi.get(sid));
                        const streams = await Promise.all(streamPromises);

                        // 2. Process each stream
                        for (const stream of streams) {
                            // Remove this block from stream
                            const filtered = stream.blockIds.filter((bid) => bid !== block.id);

                            if (filtered.length === 0) {
                                // Stream is empty, delete it
                                console.log(
                                    `[useBlockDependencyAwareDeletion]: Deleting empty stream ${stream.streamId}`,
                                );
                                await streamsApi.remove(stream.streamId);
                            } else {
                                // Update stream without this block
                                console.log(
                                    `[useBlockDependencyAwareDeletion]: Updating stream ${stream.streamId}`,
                                );
                                await streamsApi.update({ ...stream, blockIds: filtered });
                            }
                        }

                        // 3. Delete the block
                        console.log(
                            `[useBlockDependencyAwareDeletion]: Deleting block ${block.id}`,
                        );
                        await deleteBlock(block.id);
                    },

                    onSuccess: async () => {
                        console.log(`[useBlockDependencyAwareDeletion]: Cascade delete completed`);
                        // Refresh all relevant data
                        await Promise.all([gCtx.refreshBlocks(), gCtx.refreshStreams()]);
                        if (options?.onRefresh) {
                            await options.onRefresh();
                        }

                        // Handle post-deletion navigation
                        if (options?.isInJourney) {
                            console.log(
                                `[useBlockDependencyAwareDeletion]: In journey, returning home`,
                            );
                            returnHome('block', { ok: true, id: block.id });
                        } else if (options?.onComplete) {
                            console.log(
                                `[useBlockDependencyAwareDeletion]: Calling onComplete callback`,
                            );
                            options.onComplete();
                        }
                    },
                });
            } catch (err) {
                console.error(`[useBlockDependencyAwareDeletion]: Error analyzing dependencies:`, err);
                alert(`Failed to analyze dependencies: ${err}`);
                destructiveActionsStore.close();
            }
        },
        [gCtx, dispatch, returnHome, canStartDeletion, options],
    );

    return { deleteBlockWithDeps };
}
