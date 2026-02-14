// pages/admin/EventsPage.tsx

import { EventEditorSessionProvider } from '@/features/admin/eventEditor/eventEditorSession/EventEditorSession.context';
import { EventEditor } from '@/features/admin/eventEditor/ui/EventEditor';

export function EventsPage() {
  return (
    <EventEditorSessionProvider>
      <EventEditor />
    </EventEditorSessionProvider>
  );
}

export default EventsPage;
