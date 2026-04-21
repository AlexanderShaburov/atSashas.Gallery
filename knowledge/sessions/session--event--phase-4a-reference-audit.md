---
type: session
scope: [event, migration]
status: implemented
date: 2026-04-21
source_of_truth: false
tags: [audit, event-migration, phase-4a]
---

# Phase 4.A — Reference audit for legacy EventData records

## Scope

Strict reference audit, executed per `knowledge/plans/plan--event--collapse-into-event-page.md` § Phase 4.A, to confirm that none of the 5 legacy EventData IDs have live references outside their own storage file before deletion.

### IDs audited

- `event-20260214-cx1vra`
- `event-20260214-3p50kr`
- `event-20260304-wa5mrb`
- `event-20260307-yao9xe`
- `event-20260323-04op17`

### Sweeps executed

Full-repo `ripgrep` (exact-string match, all five IDs, all files) across:

1. `vault/**` — the catalog file itself + any other JSON data.
2. `apps/admin-backend/**` and `apps/frontend/src/**` — source, tests, fixtures, configs.
3. `knowledge/**` — documentation references.
4. `rules/**`, `scripts/**`, `Docs/**`, repo root — any other surface.

## Findings

Total matches across the entire monorepo: **3 files**.

| File | Matches | Classification |
|------|--------:|----------------|
| `vault/json/events/catalog.json` | 10 (5 dict keys + 5 self-id fields) | **Self-references in the file being deleted.** Expected. |
| `apps/frontend/src/features/admin/eventPageEditor/ui/SettingsSection.tsx:79` | 1 | **Stale UI placeholder string** (`placeholder="e.g. event-20260214-cx1vra"`). Not a data reference — pure hint text in an input field. The input itself (`Linked Event ID`) was demoted to legacy-only in Phase 3 and is now labelled "not used by registration". |
| `knowledge/plans/plan--event--collapse-into-event-page.md:146` | 5 | **Plan-document's own audit instructions** list the IDs. Documentation of this audit — not a consumer reference. Expected. |

**No other references anywhere**: no test fixtures, no seed files, no scripts, no config, no snapshots, no archived copies, no analytics data. Public-side assets, HomeDoc, stream blocks, event page catalog — all clean.

## Externalities (out of repo scope)

- **Stripe dashboard**: any historical `metadata.event_id` records carrying these 5 IDs cannot be swept from this repo. Per ADR `decision--event--event-page-is-canonical-event.md` ruling #7 (as revised 2026-04-21), the 5 records are leftover artifacts with no business value; even if Stripe retained traces, we do not archive. The audit documents this boundary explicitly — if a future audit/compliance need surfaces, the Stripe dashboard remains the external source.

## Blocker analysis

Per Phase 4.A gate: "Any non-archival reference stops the phase until resolved."

- All in-repo references are either (a) the file being deleted, (b) documentation of this audit, or (c) a stale UI placeholder that is not a data reference.
- The UI placeholder is cleaned up in Phase 4.B as a companion commit to keep the target state genuinely clean (per user ruling: "no legacy code left in the tree").
- Zero external-to-this-repo references are known. Stripe dashboard explicitly accepted as out-of-scope per ADR ruling.

**Verdict**: audit is clean. Phase 4.B may proceed.

## Related

- `knowledge/plans/plan--event--collapse-into-event-page.md`
- `knowledge/decisions/decision--event--event-page-is-canonical-event.md`
- `knowledge/bugs/bug--event--id-prefix-collision-between-event-and-eventpage.md`
