// src/shared/lib/dependencies/dependencyResolver.ts

import type { BlocksCollectionJSON } from '@/entities/block';
import type { StreamData, StreamIndexItem } from '@/entities/stream';
import { streamsApi } from '@/features/admin/streams/api/streamsApi';
import type {
    CascadePreview,
    DependencyEdge,
    DependencyNode,
    DependencyTree,
} from './dependency.types';

/**
 * Service for analyzing dependencies between objects
 * Finds which blocks use which artItems, and which streams use which blocks
 */
class DependencyResolver {
    /**
     * Find all blocks that use a specific artItem
     */
    findArtItemDependents(
        artId: string,
        blocksCollection: BlocksCollectionJSON,
    ): DependencyEdge[] {
        const dependents: DependencyEdge[] = [];

        for (const [blockId, block] of Object.entries(blocksCollection.blocks)) {
            if (block.blockKind === 'gallery') {
                const usedPositions: number[] = [];

                block.items.forEach((item, idx) => {
                    if (item.artId === artId) {
                        usedPositions.push(idx + 1);
                    }
                });

                if (usedPositions.length > 0) {
                    const positions = usedPositions.join(', ');
                    dependents.push({
                        parent: {
                            kind: 'block',
                            id: blockId,
                            title: block.title || blockId,
                        },
                        child: { kind: 'artItem', id: artId },
                        context: `Gallery block "${block.title || blockId}" (position${usedPositions.length > 1 ? 's' : ''}: ${positions})`,
                    });
                }
            }
        }

        return dependents;
    }

    /**
     * Find all streams that use a specific block
     */
    async findBlockDependents(
        blockId: string,
        streamsIndex: StreamIndexItem[],
    ): Promise<DependencyEdge[]> {
        const dependents: DependencyEdge[] = [];

        // Load each stream to check if it contains the block
        const streamChecks = streamsIndex.map(async (streamMeta) => {
            try {
                const stream = await streamsApi.get(streamMeta.streamId);
                const index = stream.blockIds.indexOf(blockId);

                if (index >= 0) {
                    return {
                        parent: {
                            kind: 'stream' as const,
                            id: stream.streamId,
                            title: stream.title || stream.streamId,
                        },
                        child: { kind: 'block' as const, id: blockId },
                        context: `Stream "${stream.title || stream.streamId}" (position ${index + 1} of ${stream.blockIds.length})`,
                    };
                }
            } catch (err) {
                console.error(`Failed to check stream ${streamMeta.streamId}:`, err);
            }
            return null;
        });

        const results = await Promise.all(streamChecks);
        return results.filter((dep): dep is DependencyEdge => dep !== null);
    }

    /**
     * Build complete dependency tree for an artItem
     * Includes both direct dependencies (blocks) and transitive dependencies (streams)
     */
    async buildArtItemDependencyTree(
        artId: string,
        artTitle: string | undefined,
        blocksCollection: BlocksCollectionJSON,
        streamsIndex: StreamIndexItem[],
    ): Promise<DependencyTree> {
        const target: DependencyNode = {
            kind: 'artItem',
            id: artId,
            title: artTitle,
        };

        // Find all blocks that use this artItem
        const blockDependents = this.findArtItemDependents(artId, blocksCollection);

        // Find all streams that use those blocks (transitive dependencies)
        const affectedBlockIds = blockDependents.map((dep) => dep.parent.id);
        const streamDependentsArrays = await Promise.all(
            affectedBlockIds.map((blockId) => this.findBlockDependents(blockId, streamsIndex)),
        );
        const streamDependents = streamDependentsArrays.flat();

        // Combine all dependents (streams first, then blocks)
        // This order is logical: resolve stream issues first, then blocks
        const allDependents = [...streamDependents, ...blockDependents];

        // Calculate cascade preview
        const cascadePreview = this.calculateArtItemCascade(
            affectedBlockIds,
            streamDependents,
            streamsIndex,
        );

        return {
            target,
            dependents: allDependents,
            cascadePreview: allDependents.length > 0 ? cascadePreview : undefined,
        };
    }

    /**
     * Build dependency tree for a block
     */
    async buildBlockDependencyTree(
        blockId: string,
        blockTitle: string | undefined,
        streamsIndex: StreamIndexItem[],
    ): Promise<DependencyTree> {
        const target: DependencyNode = {
            kind: 'block',
            id: blockId,
            title: blockTitle,
        };

        // Find all streams that use this block
        const dependents = await this.findBlockDependents(blockId, streamsIndex);

        // Calculate cascade preview (just remove block from streams, delete if empty)
        const cascadePreview =
            dependents.length > 0
                ? this.calculateBlockCascade(blockId, dependents, streamsIndex)
                : undefined;

        return {
            target,
            dependents,
            cascadePreview,
        };
    }

    /**
     * Calculate what would be affected by cascade deleting an artItem
     */
    private calculateArtItemCascade(
        affectedBlockIds: string[],
        streamDependents: DependencyEdge[],
        streamsIndex: StreamIndexItem[],
    ): CascadePreview {
        const blocks = new Set(affectedBlockIds);
        const streams = new Set(streamDependents.map((dep) => dep.parent.id));

        // TODO: For accurate empty stream detection, we'd need to load each stream
        // and check if removing the blocks would leave it empty
        // For now, we'll estimate based on the index
        const emptyStreams: string[] = [];

        return {
            blocks: Array.from(blocks),
            streams: Array.from(streams),
            emptyStreams,
            affectedCount: blocks.size + streams.size,
        };
    }

    /**
     * Calculate what would be affected by cascade deleting a block
     */
    private calculateBlockCascade(
        blockId: string,
        streamDependents: DependencyEdge[],
        streamsIndex: StreamIndexItem[],
    ): CascadePreview {
        const streams = new Set(streamDependents.map((dep) => dep.parent.id));

        return {
            blocks: [blockId],
            streams: Array.from(streams),
            emptyStreams: [], // Would need to load streams to determine
            affectedCount: 1 + streams.size,
        };
    }

    /**
     * Check if a stream would be empty after removing specific blocks
     */
    async wouldStreamBeEmpty(stream: StreamData, blockIdsToRemove: string[]): Promise<boolean> {
        const remaining = stream.blockIds.filter((bid) => !blockIdsToRemove.includes(bid));
        return remaining.length === 0;
    }
}

export const dependencyResolver = new DependencyResolver();
