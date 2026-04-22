---
type: open_question
scope: [data, api]
status: active
date: 2026-04-10
source_of_truth: false
tags: [backend, concurrency]
---

# Optimistic concurrency is inconsistently enforced across repos

## Observation

Only 2 of 7 surviving backend repos enforce optimistic concurrency (version check + HTTP 409 rejection):
- StreamRepo
- HomeDocRepo

The remaining 5 repos have `version` fields in their Pydantic models but do NOT validate the incoming version before saving:
- EventPageRepo
- TextVisualRepo
- MediaItemRepo
- CatalogRepo (has `catalogVersion`)
- BlockCollectionRepo (has `version`)

Historical: `PublicStreamRepo` and `EventRepo` previously appeared in these lists; both retired in 2026-04 cutovers (`decision--data--homedoc-is-sole-homepage-source.md`, `decision--event--event-page-is-canonical-event.md`).

## Risk

Without version checking, concurrent edits (e.g., two browser tabs) could silently overwrite each other. The `asyncio.Lock` prevents corrupted writes but not lost updates.

## Question

Should all repos enforce optimistic concurrency, or is the current inconsistency intentional (e.g., newer repos haven't been hardened yet)?

## Evidence

- StreamRepo version check: `stream_repo.py` (version-check block)
- HomeDocRepo version check: `home_doc_repo.py` (version-check block)
- EventPageRepo `_save()` with NO version check: `event_page_repo.py`
