// src/features/admin/streams/streamEditorSession/bootstrap/streamEditorSession.bootstrap.resolve.ts
import { openStream } from '@/features/admin/streams/streamEditorSession/data/streamEditorSession.utils';
import { nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { editSessionsDataStore } from '@/shared/state/editorSessionsData.store';
export async function resolveStreamBootstrapData(id) {
    const data = editSessionsDataStore.get({ kind: 'stream', id });
    if (data)
        return data;
    const loaded = await openStream(id);
    if (loaded)
        return {
            snapshot: loaded,
            draft: loaded,
            updatedAt: nowIso(),
        };
    throw new Error(`Stream with id: ${id} from the ticket doesn't exist.`);
}
