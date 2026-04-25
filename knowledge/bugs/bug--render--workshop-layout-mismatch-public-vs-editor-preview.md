---
type: bug
scope: [render, event-page, frontend]
status: fixed
date: 2026-04-25
fixed_date: 2026-04-25
source_of_truth: true
tags: [event, render-model, workshop, parity, assembly, mode]
---

# Workshop public page renders a different layout than editor preview

## Symptom

A Workshop event renders one structure in the editor's Preview button
and a different (smaller) structure on the public page and homepage
representation.

Public page for a Workshop:

```
Title (alone, at top)
[gap]
"Workshop Experience" heading
Experience gallery
"Participant Results" heading
Results gallery
[footer]
```

Editor preview for the same event:

```
Hero card with hero image + title + subtitle + price + date
Bridge / statement
Quick facts (date · duration · location · price)
Description
Host note
Experience gallery
Results gallery
CTA block
```

After the previous render fix, additional fields started appearing on
the public page as the author populated them, but the **structural**
gap between modes persisted: the public page silently dropped any
required section that wasn't 100 % populated, while the editor preview
rendered each section with whatever data it had.

## Root cause

`features/public/eventPage/assembleEventSections.ts` had two
divergent code paths for `required` sections:

- **`mode === 'editorPreview'`** → render the section if any source
  field is populated (`anyPresent`); otherwise emit `editor-placeholder`
  so the author still sees the structure.
- **`mode === 'production'`** → render only if every source field is
  populated (`allPresent`); otherwise drop the section silently.

The split was deliberate (avoid showing visitors broken sections), but
its consequence was that the public page never matched what the author
saw. With the prior `hasField` fix correctly treating Pydantic null
Localized as missing, the gap widened: any field the author hadn't yet
filled would now drop its enclosing section on the public side.

`features/public/eventPage/__tests__/stage4proof.test.ts` documents
the asymmetry explicitly: §4 asserted production drops the section,
§5 asserted editorPreview renders it. The author's mental model
("preview is what visitors see") had no way to be true under that
split.

## Fix — author-preview parity

`assembleEventSections.ts` now treats required sections uniformly
across modes:

- **`anyPresent` → `'rendered'`** in every mode. The mapper reads each
  field defensively (empty strings, null images), so partial data
  produces a clean section with the missing fields blank — matching
  what editor preview already showed.
- **`!anyPresent`** → mode-specific:
  - `editorPreview` → `'editor-placeholder'` (visible to author).
  - `development`  → `'error-placeholder'` plus `console.error`.
  - `production`   → silently dropped (preserves the original "don't
    ship a fully empty section" guarantee).

`strong` and `optional` sections are unchanged: still only render
when `allPresent`. (Each strong section in the codebase has a single
source field, so `anyPresent === allPresent` — the rule converges.)

## Tests

Nine tests encoded the old strict-production policy and were updated
to match the parity contract:

- `stage4proof.test.ts` §3, §4 — split into "renders with partial
  data" (other fields populated) and "drops / placeholders only when
  every source field is empty".
- `assembleEventSections.test.ts` C, D, H, plus the regression-guard
  group from the previous fix — same split.
- `mapEventToRenderModel.test.ts` C, R — assert the section now
  renders with `heroImage=null` / `priceDisplay="Free"` rather than
  being dropped.

Total: **382 / 382 event-pipeline tests pass**, **548 / 548 frontend
tests pass** (one unrelated pre-existing stray test file).

## Generalizable rule

**Author-preview parity**: any pipeline that has separate "author
view" and "visitor view" modes for the same data should converge their
visibility policy on the data side, and use mode only to decide how
*empty* states are surfaced (placeholder for author, drop for
visitor). If they diverge on whether a populated section appears at
all, the author's preview ceases to be a reliable preview.

The previous strict-production policy was a reasonable default for a
schema that hadn't yet been authored end-to-end — it protected
visitors from "broken" pages. As the editor matured to the point
where authors could populate every required field deliberately, the
strict policy started lying to authors instead of protecting
visitors. The parity policy trusts the author and falls back to
silent-drop only when the section is genuinely empty (every required
field unpopulated).

## Related

- `bug--render--event-page-section-loss-on-deploy.md` — the previous
  fix in this pipeline, which corrected `hasField` and the mapper's
  placeholder filter; this fix completes the parity story by aligning
  the assembler's mode policy.
- `architecture--editor--event-system.md` — the editor / preview
  architecture this fix spans.
- `spec--editor--event-system-behavior.md` — the contract authors
  build against.
