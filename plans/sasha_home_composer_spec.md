# SashaGallery — Home Page Composer Refactor

## 0) Intent
We want the public **Home page** to stop being “a grid of stream thumbnails only” and become a **curated mixed feed** where each tile can be:

- a **Stream tile** (existing behavior: thumbnail + link to a stream)
- a **Block tile** (new: render a block directly on Home in a “home tile mode” to support CTA, buttons, event references, etc.)

This allows the “Book/Pay” CTA to live **directly on the Home page** without forcing the user to navigate into a stream.

---

## 1) Key Architecture Decision

### Home is curated content (composition), not a derived list of streams.

Therefore:
- the existing “Public page editor” becomes the **Home Page Editor / Home Composer**
- Home composition is stored as a single document: `HomeDoc`
- Home is rendered from `HomeDoc.items[]`

---

## 2) New Concepts / Entities

### 2.1 HomeDoc (new)

A persisted document (JSON-based, consistent with current backend style)

**Suggested location:**
```
vault/json/public/home.json
```

**Shape:**
```ts
type HomeDoc = {
  items: HomeItem[];
  version?: number;
};
```

---

### 2.2 HomeItem (new)

A lightweight tile definition that references existing content.

```ts
type HomeItem =
  | { kind: 'streamRef'; streamSlug: string; size?: 'S'|'M'|'L'; thumbOverrideUrl?: string }
  | { kind: 'blockRef'; blockId: string; size?: 'S'|'M'|'L' };
```

**Important:**
- HomeItem does NOT store real content
- It only references existing entities (Stream / Block)
- Optional fields like `size` control layout only

---

### 2.3 Block “Home Tile Mode” (new rendering mode)

Blocks gain an additional render mode:

```ts
type BlockViewMode = 'stream' | 'homeTile';
```

- `stream` → existing behavior inside streams
- `homeTile` → compact / CTA-focused rendering for Home

No new Block entity is introduced.

---

## 3) What stays the same (Guardrails)

- Streams are still built from Blocks
- Events remain a separate entity with their own editor
- Blocks can reference Events
- Journey / Editor architecture must NOT be redesigned

---

## 4) UX & Behavior

### 4.1 Home Page Rendering

Home page loads `HomeDoc` and renders items in order:

#### Stream tile (`streamRef`)
- Render exactly like current thumbnail tile
- Click → navigate to stream page

#### Block tile (`blockRef`)
- Render block using `homeTile` mode
- Can include:
  - CTA button (Book / Pay)
  - secondary link (“Learn more”)
  - event data (via block → event reference)

---

### 4.2 Home Editor (ex Public Editor)

The current Public editor becomes **Home Editor**.

Supported operations:

- reorder items (existing drag & drop)
- remove items (existing)
- add stream tile (existing picker)

#### New:
- **Add Block tile**
  - open block picker
  - select block
  - add as `blockRef`

Optional (if easy):
- set tile size (S / M / L)
- override thumbnail (streams only)

---

## 5) Data Flow / APIs

### 5.1 Backend Endpoints

```
GET  /api/public/home
PUT  /api/admin/public/home
```

Returns:
```ts
HomeDoc
```

---

### 5.2 Data Resolution

- `streamRef` → resolved via existing stream logic
- `blockRef` → resolved via block storage
- event data → resolved inside block if needed

Home does NOT own content — only references.

---

## 6) Layout / Grid

- Reuse existing grid algorithm
- Extend with optional `size` support:

| Size | Behavior |
|------|---------|
| S    | normal  |
| M    | default |
| L    | larger  |

If complex → skip initially and keep uniform tiles

---

## 7) Implementation Plan

### Step 1 — Types & Storage
- Define `HomeDoc` and `HomeItem`
- Add JSON storage + loader/saver

### Step 2 — Backend API
- Implement read/write endpoints
- Secure admin route

### Step 3 — Home Renderer
- Replace stream-only logic with HomeDoc rendering
- Add:
  - `HomeStreamTile`
  - `HomeBlockTile`

### Step 4 — Home Editor
- Extend existing Public editor
- Add block picker → create `blockRef`
- Keep existing stream logic

### Step 5 — Styling
- Add `homeTile` mode styles for blocks
- Ensure CTA visibility

### Step 6 — Validation
- Works with:
  - only streams
  - only blocks
  - mixed content

- Missing refs handled safely:
  - skip or show fallback

---

## 8) Acceptance Criteria

1. Home is driven by `HomeDoc.items[]`
2. Home Editor supports:
   - reorder
   - add/remove streams
   - add/remove blocks
3. Home renders:
   - stream tiles (no regression)
   - block tiles (new)
4. CTA is visible directly on Home
5. No breaking changes to Journey / Editors

---

## 9) Guardrails

- DO NOT create a new “EventPromo entity”
- DO NOT turn Event into Block
- DO NOT move Home logic into Event editor
- HomeItem stores references only (no content duplication)
- Prefer additive changes over rewrites

---

## 10) Summary (Mental Model)

```
Block Editor → creates blocks (can reference events)

Stream Editor → builds streams from blocks

Home Editor → composes Home from:
  - stream tiles
  - block tiles

Home Page → renders HomeDoc
```

Home becomes a **curated storefront**, not just a list of streams.
