 ---
  Goal (as I read it)

  Decouple homepage composition from block-level composition and from the legacy EventData
  chain. The homepage becomes a singleton edit-only editor at /admin/home whose only
  composition units are stream tiles (by streamId) and event tiles (by EventPageData.id).
  Legacy items (blockRefs on home, "Feature on Home" buttons, any eventRef with an eventId
  shape) are either admin-migrated via explicit per-item Convert/Remove, or hard-removed.

  Main architectural decisions

  1. Journey is the only cross-editor protocol — consistent with the existing invariant.
  2. HomeDoc stores references, not embedded blocks. Composition unit is a reference
  (streamRef / eventRef), not a block.
  3. Canonical event = EventPageData. EventData / useEvent() / events/catalog.json /
  /api/public/events are explicitly forbidden from new homepage code.
  4. Read-tolerant, write-canonical. Backend accepts streamSlug | streamId and all three kinds
   on read; frontend writes only the modern shapes. No migration script.
  5. Admin-driven migration, never silent. Every legacy item is visible;
  Convert-if-resolvable, Remove otherwise; save through the normal draft flow.
  6. Anti-regression tooling (ESLint rule + PR checklist + unit test) to prevent backsliding.
  7. Rollout is gated — Phase 1 verifies stream-editor select/return capability before any
  editor code ships. Legacy /admin/public-stream runs in parallel until cutover.

  What the codebase looks like today (relative to the plan)

  - HomeDoc currently supports only streamRef (with streamSlug) and blockRef. No eventRef
  variant, no streamId field. Backend Pydantic mirrors this.
  - vault/json/public/home.json currently holds only streamRef items — no real blockRef data
  to migrate in production.
  - useHomeFeed does not call loadEventPagesOnce(); it doesn't know about eventRef today.
  - homeInsertBlock return command is defined but orphaned — nothing dispatches it.
  - EventPage editor already has selectAndReturn(id) at
  EventPageEditorSession.context.tsx:409-415. Pattern is ready.
  - Stream editor does NOT have selectAndReturn. It only returns loot via finalizeAfterSave →
  returnHome('stream', { ok, id }) in edit mode after a save (lines ~620-627). Select mode
  exists but does not terminate a journey by picking. This is the real Phase-1-gate blocker.
  - featureEventOnHome is imported in exactly two places: EventPageEditor.tsx:208 and
  EventEditor.tsx:154 (+ its own file). Phase 0 is small.
  - useEventPageByEventId currently resolves by legacy eventId — it's the path the legacy
  HomeBlockTile EventCtaTile uses. The new HomeEventTile should resolve by eventPageId, which
  is a different lookup.
  - /admin/home route is free. EditorKind already includes 'home'.

  Tricky / ambiguous parts

  1. Phase 1 fallback wording. §11 allows an inline picker "ONLY if Journey path unavailable."
   The previous plan forbade this. The fallback is trivially cheap but easy to make permanent.
   I lean strongly toward extending the stream editor with selectAndReturn, mirroring the
  EventPage pattern exactly — small diff, architecturally consistent. Confirm.
  2. streamSlug vs streamId. In the current data model, slug is the identity
  (/api/public/streams/by-ids?ids=... uses slugs). "Writing streamId" reads like a rename
  rather than a new id. Need to confirm: is this a pure field rename on the HomeDoc side, or
  do we have a separate stream id concept I'm missing?
  3. Legacy eventRef { eventId } migration case (§5.3). The codebase has zero eventRef items
  in home.json, and no eventRef variant in the current type. This migration case appears to be
   defensive/aspirational. Still implementable, but confirm whether you want us to keep that
  branch in the migration code if no data exists on disk. My default: implement it — cheap,
  keeps the plan intact.
  4. Capabilities list (§7) omits Save / Discard / Preview / Exit, and omits setItemSize. The
  previous plan had them. Treat §7 as non-exhaustive (Save/Discard/Preview/Exit are required
  for an edit-only editor), and confirm: is size editing in or out of v1? HomeItem has size?:
  'S'|'M'|'L'; if v1 is size-less, we just preserve existing sizes and don't expose a control.
  5. useEventPageByEventId vs a new getEventPageById (by eventPageId). The new HomeEventTile
  must not go through the legacy eventId resolver. I'll extend eventPagesModule with
  getEventPageById(eventPageId) (direct map lookup) and leave the legacy hook alone unless
  Phase 6 removes it.
  6. §10 "homepage does not render event tiles before load completes." Strict reading: show a
  skeleton/placeholder per eventRef until loadEventPagesOnce() settles, rather than hiding or
  flickering. Confirm that's the intended UX.
  7. Anti-regression ESLint rule. The cheapest implementation is no-restricted-imports /
  no-restricted-syntax in eslint.config.js, scoped to src/features/admin/homeEditor/**,
  src/features/public/ui/HomeEventTile/**, src/features/public/hooks/useHomeFeed*. Confirm
  that's acceptable, or you want something custom.
  8. Where should the plan live in the vault? homepage_editor_plan.md sits at the project
  root. Project convention stores plans in Docs/plans/ and knowledge/plans/. Before we start,
  want me to copy it to knowledge/plans/plan--editor--homepage-editor.md with frontmatter
  (status: in_progress) so the vault is coherent?

  Proposed high-level approach (no code yet)

  Phase 0 — Reset (small)
  - Delete features/admin/shared/featureEventOnHome.ts.
  - Remove the two call sites + their buttons in EventEditor.tsx and EventPageEditor.tsx.
  - Leave useEventPageByEventId in place (still used by HomeBlockTile — it dies in Phase 6).

  Phase 1 — Stream select gate (blocking)
  - Extend StreamEditorSession with selectAndReturn(streamId) mirroring EventPage's
  implementation.
  - Wire a select-mode click path (isJourney ? selectAndReturn(stream.id) :
  openStream(stream.id)).
  - Verify by dispatching a throwaway ticket and observing { ok:true, id } loot.
  - No fallback to an inline picker unless you instruct otherwise.

  Phase 2 — Data model + infra
  - Frontend HomeItem union: add HomeEventRef { kind:'eventRef'; eventPageId; size? }; rename
  streamSlug → streamId in HomeStreamRef (still read-tolerant for streamSlug).
  - Backend Pydantic: accept all three kinds on read; accept both streamSlug and streamId;
  writes canonical.
  - ReturnCommand union: add homeInsertStream, homeInsertEvent; mark homeInsertBlock
  @deprecated.
  - eventPagesModule: add getEventPageById(eventPageId) (direct lookup).
  - useHomeFeed: call loadEventPagesOnce() at mount; resolve eventRef → EventPageData; render
  placeholder until settle.
  - Ship public HomeEventTile reading EventPageData only (title, heroImage, preset,
  dateStart?, ctaLabel?), rendered as a <Link to="/event/{eventPageId}">.
  - Keep existing public stream tile behavior.

  Phase 3 — Homepage Editor shell at /admin/home
  - features/admin/homeEditor/** with route, session provider, bootstrap (once-per-mount,
  arrival('home'), dispatches on returnEffect.kind).
  - Session surface: homeDoc, isLoading, isSaving, isDirty, isJourney, addStreamViaJourney(),
  addEventViaJourney(), openStreamItem, openEventItem, removeItem, reorderItems, save,
  discard, preview, exit. Size editing: TBD pending answer above.
  - Read-only first → mutate → Journey add.
  - Admin tiles: HomeStreamTileAdmin, HomeEventTileAdmin wrapping the public tiles with
  overlay + ThreeDotMenu.

  Phase 4 — Migration UI
  - LegacyBlockTileAdmin with Convert/Remove per §5 rules (eventCta + matching EventPage →
  Convert, else Remove).
  - OrphanTileAdmin for unresolved streamId / eventPageId.
  - Banner on dirty draft if orphans present; Save not blocked.
  - Manual validation pass per the plan's checklist.

  Phase 5 — Route switch
  - Admin nav: "Public stream" → "Homepage".
  - /admin/public-stream → /admin/home redirect.
  - features/admin/publicStream/** stays on disk, unmounted.

  Phase 6 — Cleanup (after stable cycle)
  - Delete publicStream/**, HomeBlockTile, useEventPageByEventId (if no remaining users),
  homeInsertBlock, HomeBlockRef, and tighten Pydantic to two kinds.
  - Knowledge-vault writeback at this point: update architecture--data--domain-model.md,
  architecture--navigation--journey-system.md (return-command table), and add a
  spec--editor--homepage-editor-behavior.md.

  What I need from you before starting

  Please answer these so I can proceed without guessing:

  1. Phase 1: extend StreamEditorSession with selectAndReturn (my recommendation), or keep the
   inline-picker fallback option open?
  2. streamSlug vs streamId: is it a pure field rename on HomeDoc, or is there a separate id
  concept?
  3. v1 size editing: in or out? (If out, we preserve existing sizes and hide the control.)
  4. Save / Discard / Preview / Exit — confirm these are in v1 (assumed, not listed in §7).
  5. §10 eventRef loading UX: skeleton placeholder until loadEventPagesOnce() settles —
  correct reading?
  6. ESLint anti-regression rule: no-restricted-imports / no-restricted-syntax in the existing
   flat config — acceptable?
  7. Plan placement: want me to copy the plan to
  knowledge/plans/plan--editor--homepage-editor.md with status: in_progress frontmatter before
   we start?
  8. useEventPageByEventId (legacy eventId resolver): my plan is to leave it untouched and
  kill it in Phase 6 when HomeBlockTile dies. OK?

  Once these are answered I'll proceed phase-by-phase with a report after each gate.