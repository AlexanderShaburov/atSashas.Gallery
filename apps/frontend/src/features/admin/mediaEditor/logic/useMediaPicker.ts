// features/admin/mediaEditor/logic/useMediaPicker.ts
// Generic hook for dispatching a media pick Journey and handling the return.
// Used by any editor that needs to select a MediaItem via the Media Editor picker.

import type { JourneyTicket } from '@/shared/nav';
import type { EditorKind } from '@/shared/nav/editorKey.types';
import type { JourneyHome } from '@/shared/nav/journeySession.types';
import { useDispatch } from '@/features/admin/shared/transporter/transporter';
import { createNonce, nowIso } from '@/shared/lib/dateAndLabels/nonceAndNow';
import { generateId } from '@/shared/lib/id/generateId';
import { useCallback } from 'react';

/**
 * Build a Journey ticket that navigates to the Media Editor in picker mode.
 * Returns to the caller editor in edit mode with the same objectId.
 */
export function buildMediaPickerTicket(
  callerEditor: Exclude<EditorKind, 'hopper'>,
  callerObjectId: string,
): JourneyTicket {
  return {
    journeyId: generateId('travel'),
    destination: { editor: 'mediaItems', mode: 'select' },
    returnTo: { editor: callerEditor, mode: 'edit', objectId: callerObjectId },
    phase: 'outbound',
    nonce: createNonce(),
    createdAt: nowIso(),
    returnEffect: undefined,
  };
}

/**
 * Hook that provides a dispatch function for picking a media item.
 * The caller stores which field triggered the pick (e.g. 'heroImage')
 * in its own local state before calling dispatchPick.
 */
export function useMediaPickerDispatch(callerEditor: Exclude<EditorKind, 'hopper'>) {
  const dispatch = useDispatch();

  const dispatchPick = useCallback(
    (callerObjectId: string) => {
      const ticket = buildMediaPickerTicket(callerEditor, callerObjectId);
      const home: JourneyHome = { editor: callerEditor, objectId: callerObjectId };
      dispatch(ticket, home);
    },
    [callerEditor, dispatch],
  );

  return dispatchPick;
}
