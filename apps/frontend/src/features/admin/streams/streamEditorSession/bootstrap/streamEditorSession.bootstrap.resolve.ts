// src/features/admin/streams/streamEditorSession/bootstrap/streamEditorSession.bootstrap.resolve.ts

import { StreamData } from '@/entities/stream';
import { openStream } from '@/features/admin/streams/streamEditorSession/data/streamEditorSession.utils';
import { nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { DraftSnapshot, editSessionsDataStore } from '@/shared/state/editorSessionsData.store';
export async function resolveStreamBootstrapData(id: string): Promise<DraftSnapshot<StreamData>> {
    const data = editSessionsDataStore.get<StreamData>({ kind: 'stream', id });
    if (data) return data;
    const loaded = await openStream(id);
    if (loaded)
        return {
            snapshot: loaded,
            draft: loaded,
            updatedAt: nowIso(),
        };
    throw new Error(`Stream with id: ${id} from the ticket doesn't exist.`);
}
