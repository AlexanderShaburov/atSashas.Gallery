import { nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { editSessionsDataStore } from '@/shared/state';
import { getCollection } from '../../api/blocksApi';
export async function resolveBlockBootstrapData(id) {
    const data = editSessionsDataStore.get({ kind: 'block', id });
    if (data)
        return data;
    const collection = await getCollection();
    if (collection.blocks[id])
        return {
            snapshot: collection.blocks[id],
            draft: collection.blocks[id],
            updatedAt: nowIso(),
        };
    throw new Error(`Block with id: ${id} form the ticket doesn't exist`);
}
