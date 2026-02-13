// pages/admin/PublicStreamPage.tsx

import { PublicStreamSessionProvider } from '@/features/admin/publicStream/publicStreamSession/PublicStreamSession.context';
import { PublicStreamEditor } from '@/features/admin/publicStream/ui/PublicStreamEditor';

export function PublicStreamPage() {
    return (
        <PublicStreamSessionProvider>
            <PublicStreamEditor />
        </PublicStreamSessionProvider>
    );
}

export default PublicStreamPage;
