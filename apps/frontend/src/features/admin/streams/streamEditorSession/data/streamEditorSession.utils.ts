import {
    CreateStreamResponse,
    DeleteStreamResponse,
    ListStreamsResponse,
    StreamData,
    StreamMetadata,
    UpdateStreamResponse,
} from '@/entities/stream';
import { streamsApi } from '@/features/admin/streams/api';
import { todayISO } from '@/shared/lib/dateAndLabels/today';
import { generateId } from '@/shared/lib/id/generateId';

export function createNewStreamDraft(): StreamData {
    return {
        streamId: generateId('stream'),
        title: 'untitled stream',
        status: 'draft',
        tags: [],
        description: '',
        thumbnail: '',
        version: 0,
        createdAt: todayISO(),
        updatedAt: todayISO(),
        blockIds: [],
    };
}

export async function requestNewStream(body: StreamMetadata): Promise<CreateStreamResponse> {
    return await streamsApi.create(body);
}

export async function loadStreamsIndex(): Promise<ListStreamsResponse> {
    return await streamsApi.list();
}

export async function openStream(id: string): Promise<StreamData> {
    return await streamsApi.get(id);
}

export async function deleteStream(streamId: string): Promise<DeleteStreamResponse> {
    console.log(`[Stream API][deleteStream] called`);
    return await streamsApi.remove(streamId, true);
}

export async function updateStream(stream: StreamData): Promise<UpdateStreamResponse> {
    return await streamsApi.update(stream);
}
