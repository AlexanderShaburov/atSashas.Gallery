// entities/publicStream/PublicStream.ts

import type { PublicStreamData } from './publicStream.types';

/**
 * PublicStream entity - manages the curated list of streams visible to public
 *
 * Design principles:
 * - Immutable operations (all methods return new instance)
 * - Only streams with status 'ready' or 'published' should be added
 * - Streams in PublicStream are protected from editing
 */
export class PublicStream {
    constructor(public readonly data: PublicStreamData) {
        this.validate();
    }

    private validate(): void {
        if (this.data.kind !== 'PublicStream') {
            throw new Error('Invalid PublicStream: kind must be "PublicStream"');
        }
        if (!Array.isArray(this.data.streamIds)) {
            throw new Error('Invalid PublicStream: streamIds must be an array');
        }
        if (this.data.version < 0) {
            throw new Error('Invalid PublicStream: version must be non-negative');
        }
    }

    /**
     * Create PublicStream from JSON data
     */
    static fromJSON(json: unknown): PublicStream {
        if (!json || typeof json !== 'object') {
            throw new Error('Invalid JSON: expected object');
        }

        const data = json as Partial<PublicStreamData>;

        if (data.kind !== 'PublicStream') {
            throw new Error('Invalid JSON: kind must be "PublicStream"');
        }

        const publicStreamData: PublicStreamData = {
            kind: 'PublicStream',
            version: data.version ?? 0,
            streamIds: data.streamIds ?? [],
            createdAt: data.createdAt ?? new Date().toISOString(),
            updatedAt: data.updatedAt ?? new Date().toISOString(),
        };

        return new PublicStream(publicStreamData);
    }

    /**
     * Convert to JSON format
     */
    toJSON(): PublicStreamData {
        return { ...this.data };
    }

    /**
     * Create initial empty PublicStream
     */
    static createEmpty(): PublicStream {
        const now = new Date().toISOString();
        return new PublicStream({
            kind: 'PublicStream',
            version: 1,
            streamIds: [],
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Add stream to PublicStream (immutable)
     */
    addStream(streamId: string): PublicStream {
        // Prevent duplicates
        if (this.data.streamIds.includes(streamId)) {
            return this;
        }

        return new PublicStream({
            ...this.data,
            streamIds: [...this.data.streamIds, streamId],
            version: this.data.version + 1,
            updatedAt: new Date().toISOString(),
        });
    }

    /**
     * Remove stream from PublicStream (immutable)
     */
    removeStream(streamId: string): PublicStream {
        const filtered = this.data.streamIds.filter((id) => id !== streamId);

        // No change if stream wasn't there
        if (filtered.length === this.data.streamIds.length) {
            return this;
        }

        return new PublicStream({
            ...this.data,
            streamIds: filtered,
            version: this.data.version + 1,
            updatedAt: new Date().toISOString(),
        });
    }

    /**
     * Reorder streams (immutable)
     * @param streamIds - new ordered list of stream IDs
     */
    reorder(streamIds: string[]): PublicStream {
        // Validate that all IDs in new order exist in current list
        const currentSet = new Set(this.data.streamIds);
        const newSet = new Set(streamIds);

        if (currentSet.size !== newSet.size) {
            throw new Error('Reorder failed: stream count mismatch');
        }

        for (const id of streamIds) {
            if (!currentSet.has(id)) {
                throw new Error(`Reorder failed: stream ${id} not in current list`);
            }
        }

        return new PublicStream({
            ...this.data,
            streamIds: [...streamIds],
            version: this.data.version + 1,
            updatedAt: new Date().toISOString(),
        });
    }

    /**
     * Check if stream is in PublicStream
     */
    hasStream(streamId: string): boolean {
        return this.data.streamIds.includes(streamId);
    }

    /**
     * Get number of streams in PublicStream
     */
    get count(): number {
        return this.data.streamIds.length;
    }

    /**
     * Check if PublicStream is empty
     */
    get isEmpty(): boolean {
        return this.data.streamIds.length === 0;
    }
}
