import { streamsApi } from '@/features/admin/streams/api';
import { todayISO } from '@/shared/lib/dateAndLabels/today';
import { generateId } from '@/shared/lib/id/generateId';
export function createNewStreamDraft() {
    return {
        streamId: generateId('stream'),
        title: 'untitled stream',
        status: 'draft',
        tags: [],
        description: '',
        version: 0,
        createdAt: todayISO(),
        updatedAt: todayISO(),
        blockIds: [],
    };
}
export async function requestNewStream(body) {
    return await streamsApi.create(body);
}
export async function loadStreamsIndex() {
    return await streamsApi.list();
}
export async function openStream(id) {
    return await streamsApi.get(id);
}
export async function deleteStream(streamId) {
    console.log(`[Stream API][deleteStream] called`);
    return await streamsApi.remove(streamId, true);
}
export async function updateStream(stream) {
    return await streamsApi.update(stream);
}
