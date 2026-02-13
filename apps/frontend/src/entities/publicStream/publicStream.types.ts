// entities/publicStream/publicStream.types.ts

/**
 * PublicStream - curated list of streams visible to public users
 * Only streams with status 'ready' or 'published' can be added
 * Streams in PublicStream are locked from editing (must unpublish first)
 */
export type PublicStreamData = {
    kind: 'PublicStream';
    version: number;
    streamIds: string[]; // ordered list of stream IDs to display
    createdAt: string;
    updatedAt: string;
};

/**
 * Result of validation check for adding stream to PublicStream
 */
export type PublicStreamValidation = {
    canPublish: boolean;
    reason?: string; // reason why stream cannot be published
};
