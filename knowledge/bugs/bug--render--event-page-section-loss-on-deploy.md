---
type: bug
scope: [render, event-page, frontend]
status: fixed
date: 2026-04-25
fixed_date: 2026-04-25
source_of_truth: true
tags: [event, render-model, assembly, serialization, pydantic, localized]
---

# Event preview / public render drops most sections after deployment

## Symptom

Server-deployed admin reports:

> Hero image disappears. Hero phrase / statement disappears. Event facts
> disappear. Price disappears. Subtitles, description, host note all
> disappear. Only one title and the gallery images survive.

The same event renders correctly in the editor's form view; only the
preview pane and the public event page lose content.

## Root cause — two compounding bugs in the same pipeline

### Bug A — `mapEventToRenderModel` drops the placeholder outputs that the assembler intentionally produces

`features/public/eventPage/mapEventToRenderModel.ts` had:

```ts
for (const output of rendered) {
    if (output.status !== 'rendered') continue;   // ← drop
    const section = mapSection(...);
    if (section) sections.push(section);
}
```

`getRenderedSections` (in `assembleEventSections.ts:134`) deliberately
keeps `'editor-placeholder'` and `'error-placeholder'` outputs alongside
`'rendered'` ones — see the assembler's comment:
*"Section components handle empty/undefined fields gracefully."* The
intent is: in editor-preview mode, render the section structure even
with partial data so the author sees what they're building. The
mapper's `continue` cancelled that intent.

Effect: in the editor's Preview, every required section whose source
fields were not yet populated vanished entirely. No structure, no
empty fields, just gone.

### Bug B — `hasField` treats Pydantic-serialized null Localized as "present"

The backend `Localized` Pydantic model has five locale fields
(`en/ru/it/es/pt`) that all default to `None`. Round-tripping through
the API yields `{en:null, ru:null, it:null, es:null, pt:null}` on the
wire — five keys, none with content. The previous `hasField`:

```ts
if (typeof value === 'object') return Object.keys(value).length > 0;
```

reported these as present. Downstream:

- `assembleEventSections` accepted the field as populated and emitted
  `'rendered'` for the section.
- `mapEventToRenderModel` called `text(loc)` and produced `''`.
- Section components rendered the structure with every text slot blank.

The user describes this as "disappeared".

### Why the symptoms split the way they did

| Field shape | Old `hasField` | Outcome |
|---|---|---|
| `{}` (factory-fresh, never typed) | `false` | Production drops the section silently → vanishes |
| `{en:null, ru:null, …}` (Pydantic round-trip) | `true` | Section renders with blank text → "disappeared" feel |
| `{en:"Hello", ru:null, …}` | `true` | Renders correctly |
| Arrays of media IDs (`experienceImages`) | `true` if non-empty | Galleries survived because their backend type doesn't fluff with nulls |

That asymmetry — text sections drop, gallery sections render — exactly
matches the reported symptom set.

## Fix

### `features/public/eventPage/assembleEventSections.ts`

Replace `hasField`'s flat key-count check with a recursive "any leaf is
content-bearing" check. Empty objects, empty strings, all-null
Localized objects, and empty arrays are all treated as missing.
Numbers / booleans (including `0` for `price.amount`) are still
content.

### `features/public/eventPage/mapEventToRenderModel.ts`

Drop the `if (output.status !== 'rendered') continue;` guard. Every
output that survives `getRenderedSections` is now mapped — including
`editor-placeholder` and `error-placeholder` — because `mapSection`
reads each field defensively and produces an empty-but-structured
section.

### Tests

- `mapEventToRenderModel.test.ts:720` — the existing test that encoded
  the buggy "section disappears in dev mode" behavior was rewritten
  to assert the new (correct) behavior: the section IS rendered with
  an empty `dateDisplay`.
- `assembleEventSections.test.ts` — three new regression-guard tests
  in a "Regression — null-Localized is treated as missing" group
  cover: all-null Localized → section dropped in production,
  partially populated Localized → section rendered, empty-string
  Localized → section dropped.

## Verification

- `tsc --noEmit` clean.
- `vitest run src/features/public/eventPage src/features/admin/eventPageEditor src/entities/event` — 378 / 378 pass.
- Full frontend `vitest run` — 544 / 544 pass (one unrelated
  pre-existing stray test file unchanged).

## Generalizable lessons

1. **"Has content" is not the same as "has key".** Anywhere the
   frontend decides whether a Pydantic-serialized field is populated,
   it must look at the leaf values, not the surface keys. Audit other
   `Object.keys(...).length > 0` patterns under `features/**` and
   `entities/**` against this rule.
2. **Pipeline asymmetries hide bugs.** `getRenderedSections` and the
   mapper had different filter predicates for the same set of
   outputs. The assembler did the work to produce placeholder rows;
   one of the consumers ignored them. When two stages of a pipeline
   both filter, they should filter against a shared, named contract,
   not two private predicates.
3. **Schema-divergence between editor draft and wire shape.** The
   factory writes `{}` for empty Localized; the backend writes
   `{en:null, ru:null, …}`. Either side considered alone passes most
   tests; the divergence only manifests when the same event flows
   through both, which is exactly the deploy / round-trip path. A
   single "empty Localized" canonical form would have prevented this
   bug class entirely.

## Recommendations

- Consider tightening Pydantic Localized serialization to drop
  null-only locales (`exclude_none=True` on the model dump path),
  bringing the wire shape in line with the factory's `{}` default.
- Add a small lint or runtime check at the assembler boundary that
  warns when a section is `'rendered'` but every text leaf is empty —
  same content, different signal.
- Once the deployed bundle includes this fix, re-test the round-trip:
  create event → save → reload → preview → public. All four surfaces
  should show identical content.

## Related

- `bug--deployment--clean-vault-boot-blocked.md`,
  `bug--deployment--crypto-randomuuid-insecure-context.md` —
  sibling deploy-only bug class where local works but server
  exposes a runtime / schema gap
- `architecture--editor--event-system.md` — the editor / preview
  separation this bug spans
- `spec--editor--event-system-behavior.md` — the contract these two
  surfaces must agree on
