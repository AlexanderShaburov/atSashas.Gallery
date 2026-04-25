---
type: bug
scope: [editor, blocks, frontend]
status: fixed
date: 2026-04-25
fixed_date: 2026-04-25
source_of_truth: true
tags: [block-editor, caption, restoration, post-migration]
---

# Slot caption authoring disconnected from Block Editor after migration

## Symptom

Each gallery slot has a `caption: Localized` field on `GalleryArtItem`,
and the Block Customizer presents per-slot caption visibility / position
/ font / color controls. But the Block Editor itself offers **no way to
write or edit the caption text** — clicking the slot triggers the
art-pick journey, and there's no inline text affordance anywhere.

Symptoms in QA:

- Customizer's per-slot caption section reads `item.caption?.en` to
  decide whether to show its appearance UI; with no authoring path,
  this gate is permanently false on freshly created blocks.
- The data model still carries the field, so any pre-migration block
  with a caption renders with it but the user can't change it.
- The user described the previous behavior: a clickable caption text
  on the slot image that became an inline input on click.

## Root cause — restoration, not regression

The data model and the editor's plumbing for caption editing are all
still in place:

- `GalleryArtItem.caption: Localized` (`entities/block/block.types.ts:72`)
- `EditTarget` includes `{blockKind: 'gallery', kind: 'imageCaption', slot}`
  (`entities/block/block-targets.types.ts`)
- `BlockHit` factory: `Hit.galleryCaption(slot)`
  (`entities/block/blockHit.types.ts:30`)
- `BlockEditorSession` exposes `currentTarget`, `setCurrentTarget`,
  `isEditingTarget`, `unHit` — the inline-edit state machine
  (`features/admin/blocks/blockEditorSession/BlockEditorSession.context.tsx`)
- `InlineEditableText` component implements the click → input → commit
  flow, keyed on `EditTarget`
  (`features/admin/shared/ui/BlockPreview/InlineEditableText.tsx`)
- CSS class `.blk-inline-input` already styles the input
  (`pages/admin/BlocksPage/block-gallery.core.css:100`)

What's missing: no component renders a caption surface for gallery
slots. `InlineEditableText` was exported but had zero call sites
across the codebase. During the recent block / event migrations, the
caption authoring widget was removed without re-wiring its replacement.

## Fix

A new `SlotCaptionEditor` component sits below each populated slot in
the admin Block Editor's `GalleryComponent`. It uses the existing
`InlineEditableText` machinery and updates `block.items[i].caption`
through the session's `setDraft`. Customizer behavior is unchanged —
it continues to read the same caption field for its `hasText` gate.

Files added:

- `apps/frontend/src/features/admin/shared/ui/BlockPreview/SlotCaptionEditor.tsx`

Files modified:

- `apps/frontend/src/features/admin/shared/ui/BlockPreview/GalleryComponent.tsx` — passes `renderArtContent` to `GalleryBlockView` so each populated slot also gets its caption editor below the picture, but only when `parent === 'editor'` and not in `readOnly` mode (homepage preview / public surfaces continue to render picture-only).
- `apps/frontend/src/features/admin/shared/ui/BlockPreview/index.ts` — export the new component.
- `apps/frontend/src/pages/admin/BlocksPage/block-gallery.core.css` — minimal `.blk-slot-caption` rules (display, hover hint, "+ Add caption" placeholder italic).

## Behavior

- Empty slot caption → "+ Add caption" placeholder under the image.
- Click the placeholder → switch to inline `<input>` (the existing
  `.blk-inline-input` style). Click the existing caption text → same.
- Type → blur or Enter → committed to `block.items[i].caption.en`.
  Blank result removes the `caption` key entirely so the customizer's
  `item.caption?.en` gate falls back to `false`.
- Escape → discard the in-flight edit.
- Click target propagation: the caption click is `e.stopPropagation()`
  so it does NOT trigger the slot-image art-pick journey when the user
  is in journey-pick mode.

## Generalizable rule (added to vault)

**Restoration ≠ regression.** When a multi-step migration removes a UI
surface that has supporting data, types, state machinery, and CSS all
still intact, treat the missing component as "the wiring step was
skipped" rather than re-designing the feature. The data model carries
the contract; the only choice is which surface to re-attach. In this
case the inline-edit pattern was already implemented (InlineEditableText)
and waiting for a consumer.

## Verification

- `tsc --noEmit` clean.
- `vitest run` — 554 / 554 pass (one unrelated pre-existing stray file).
- Manual browser confirmation pending (component renders only for
  gallery slots that have `kind === 'art'` items; empty slots keep
  their existing pick-image affordance unchanged).

## Related

- `entities/block/block.types.ts` — `GalleryArtItem.caption` field.
- `features/admin/blocks/ui/BlockCustomizer/CaptionControls.tsx` —
  customizer's appearance UI; reads the same `item.caption?.en` gate.
- `architecture--editor--dual-mode-context-control-plane.md` — the
  pattern this restoration follows (control plane in session, content
  flows through draft updates).
