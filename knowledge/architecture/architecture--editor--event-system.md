---
type: architecture
scope: [editor]
status: active
date: 2026-04-21
source_of_truth: true
tags: [event, editor]
---

# Event Editor structure

The SashaGallery admin exposes a single Event Editor (`EventPageEditor`) managing `EventPageData`. The legacy dual-editor architecture (parallel `EventEditor` for `EventData`) was retired by `decision--event--event-page-is-canonical-event.md`. This document describes the canonical editor only.

## Editor

Manages `EventPageData` — preset-based records (`workshop`, `pleinAir`, `exhibition`, `minimal`). Persisted at `vault/json/event_pages/catalog.json` via `/api/admin/event-pages` and served publicly from `/api/public/event-pages`.

Route: `/admin/event-pages`. Dashboard tile label: "Events".

### Screen modes (stack-based)

```ts
modeStack: ScreenMode[] = ['select'];
type ScreenMode = 'select' | 'create' | 'edit' | 'preview';
```

### Draft model

Full `EventPageData` stored as-is. Field updates via `setDraftField(field: string, value: unknown)`.

Dirty tracking: `isDirty = JSON.stringify(draft) !== JSON.stringify(snapshot)`.

### Field visibility

Per-preset visibility map (`fieldVisibility.ts`) controls form sections. 5 sections: content, logistics, cta, media, settings.

### CTA behavior config

`EventPageData` carries an optional `ctaAction: CtaAction` (discriminated union: `external | register | inquiry`). Defined in `entities/event/ctaAction.ts`, resolved at read via `resolveCtaAction(page)` which infers a `register` action from the `price` field when absent. See `spec--editor--event-system-behavior.md` § "CTA action" for behavior rules.

### Enrollments

`EventPageData.enrollments: dict<Enrollment>` holds registration records. Enrollment submissions from the public site flow through `POST /api/public/event-pages/{id}/enroll` (renamed from the legacy `/public/events/{id}/enroll` as part of the migration cleanup).

## File structure

```
eventPageEditor/
├── session/EventPageEditorSession.context.tsx
├── api/eventPagesAdminApi.ts
├── ui/
│   ├── EventPageEditor.tsx
│   ├── CtaSection.tsx
│   ├── SettingsSection.tsx
│   └── ...
└── __tests__/
```

## Related

- `spec--editor--event-system-behavior.md` — behavior and flow spec
- `decision--event--event-page-is-canonical-event.md` — ADR retiring the legacy split
- `invariant--architecture--single-event-entity.md` — the rule preventing re-introduction of a parallel event model
- `plan--event--collapse-into-event-page.md` — migration execution plan

## Historical note

From 2026-02 through 2026-04-21 a second editor (`EventEditor`) existed at `/admin/events` managing a distinct `EventData` shape in `vault/json/events/catalog.json`. It was hidden from navigation and served no user flow. The migration plan above removes it in its Phase 5.
