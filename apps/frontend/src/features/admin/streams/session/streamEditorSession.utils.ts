import { StreamData } from '@/entities/stream';
import {
    CreateStreamRequest,
    CreateStreamResponse,
    DeleteStreamResponse,
    ListStreamsResponse,
    UpdateStreamResponse,
} from '@/entities/stream/streamApi.types';
import { streamsApi } from '@/features/admin/streams/api';
import { todayISO } from '@/shared/lib/date/Today';
import { generateId } from '@/shared/lib/id/generateId';

export function createNewStreamDraft(): StreamData {
    return {
        streamId: generateId('stream'),
        title: '',
        status: 'draft',
        tags: [],
        description: '',
        version: 0,
        createdAt: todayISO(),
        updatedAt: todayISO(),
        blockIds: [],
    };
}

export async function createNewStream(body: CreateStreamRequest): Promise<CreateStreamResponse> {
    return await streamsApi.create(body);
}

export async function loadStreamsIndex(): Promise<ListStreamsResponse> {
    return await streamsApi.list();
}

export async function openStream(id: string): Promise<StreamData> {
    return await streamsApi.get(id);
}

export async function deleteStream(streamId: string): Promise<DeleteStreamResponse> {
    return await streamsApi.remove(streamId);
}

export async function updateStream(stream: StreamData): Promise<UpdateStreamResponse> {
    return await streamsApi.update(stream);
}
