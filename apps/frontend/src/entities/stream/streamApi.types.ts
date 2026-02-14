// src/entities/stream/StreamApi.ts
import type { StreamData, StreamIndexItem } from './stream.types';

export type StreamMetadata = {
    streamId: string;
    title: string;
    tags: string[];
    description: string;
    thumbnail?: string; // Optional: set via journey, not form input
};

export type CreateStreamResponse = StreamData;

export type ListStreamsResponse = StreamIndexItem[];

export type UpdateStreamRequest = StreamData; // Full replace with version check
export type UpdateStreamResponse = StreamData;

export type DeleteStreamResponse = { ok: true };
