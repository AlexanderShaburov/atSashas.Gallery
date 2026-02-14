// src/entities/stream/Stream.ts

export type StreamStatus = 'draft' | 'ready' | 'archived' | 'published';

export type StreamData = {
    streamId: string; // Slug/id, also filename (e.g., "home")
    title: string; // Human-readable name shown in the UI
    status?: StreamStatus;

    tags: string[]; // For filtering in the stream list
    description: string; // Optional short text for admin/SEO
    thumbnail: string; // URL to user-selected thumbnail image (optional)

    version: number; // Optimistic concurrency
    createdAt: string; // ISO string
    updatedAt: string; // ISO string

    blockIds: string[]; // Ordered list of block IDs
};

export type StreamIndexItem = {
    streamId: string;
    title: string;
    thumbnail: string;
    status: StreamStatus;
    tags: string[];
    description: string;
    updatedAt: string;
};

export type StreamsIndex = {
    version: number;
    updatedAt: string;
    streams: StreamIndexItem[];
};
