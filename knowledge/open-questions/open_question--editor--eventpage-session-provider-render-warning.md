---
type: open_question
scope: [editor, event-page]
status: fixed
date: 2026-04-22
resolved_date: 2026-04-22
source_of_truth: true
tags: [react, render-warning, event-page-editor]
---

# EventPageEditorSessionProvider render-cycle warning

## Symptom

During manual QA of the event editor (2026-04-22), React logs a warning to the console:

> Cannot update a component (`EventPageEditorSessionProvider`) while rendering a different component (`EventPageEditorSessionProvider`).

Refined repro (2026-04-22):

1. Open the EventPage editor at `/admin/event-pages`.
2. Enter Edit mode (select an existing page or create a new one).
3. Exit Edit mode back to Select mode (the `back()` action).

The warning fires precisely on the Edit → Select transition.

## Resolution (2026-04-22)

**Root cause:** `back()` in
`apps/frontend/src/features/admin/eventPageEditor/session/EventPageEditorSession.context.tsx`
placed two impurities inside the `setModeStack` updater function:

1. A sibling setter call — `setEditorKeyId(null)`.
2. A synchronous external-store emit — `editSessionsDataStore.clear(editorKeyRef.current)`
   (calls `BaseStore.emit()` which iterates listeners synchronously).

React requires `setState` updater functions to be pure. React 18 invokes them during
the render phase (and twice in StrictMode). Calling a second setter and emitting to
`useSyncExternalStore` listeners while the updater was executing scheduled renders on
the provider mid-render, producing the warning. The initial bootstrap path was not the
cause — it was already StrictMode-safe via the `cancelled` flag pattern.

**Fix:** Flatten `back()` so all three operations happen at the top level of the
handler (React 18 auto-batches them into a single render), and read the current mode
stack via `modeStackRef` rather than from the updater's `s` argument:

```tsx
const modeStackRef = useRef(modeStack);
modeStackRef.current = modeStack;

const back = useCallback(() => {
  const current = modeStackRef.current;
  if (current.length <= 1) return;
  const leavingEdit = current[current.length - 1] === 'edit';

  if (leavingEdit) {
    if (editorKeyRef.current) {
      editSessionsDataStore.clear(editorKeyRef.current);
    }
    setEditorKeyId(null);
  }
  setModeStack((s) => (s.length <= 1 ? s : s.slice(0, -1))); // pure updater
}, []);
```

This matches the flat pattern already used in sibling editors
(e.g. `TextVisualEditorSession.context.tsx` `back()`), where all setters and
store operations are called sequentially outside any updater.

**Verification:**
- `tsc --noEmit` — clean.
- `vitest run src/features/admin/eventPageEditor src/entities/event` — 232/232 pass.
- Manual browser repro (Edit → Select) confirmed by user on 2026-04-22 — warning
  no longer logs to the console.

## Generalizable rule

Inside any `setState(updater)` call:

- do not call other setters;
- do not perform external-store writes (the `emit()` fan-out is synchronous);
- treat the updater as render-phase code.

For multi-setter / side-effecting transitions, read prior state from a ref and flatten
the operations at the top of the handler. React 18 auto-batching still collapses them
into one render.

## Related

- `knowledge/plans/plan--event--collapse-into-event-page.md` (Phase 6 notes)
- `knowledge/architecture/architecture--editor--event-system.md`
- `knowledge/patterns/pattern--state--draft-snapshot.md`
