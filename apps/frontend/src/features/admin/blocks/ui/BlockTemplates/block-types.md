# Block Types Overview

This document describes all block types used in the admin editor and in the public stream layout.

## 1. Gallery Blocks

**Block kind:** `gallery`  
**Entity type:** `GalleryBlock`  
**Layout field:** `layout: GalleryLayout`

Gallery blocks are image mosaics composed of 1–3 images arranged in different layouts.  
Each concrete layout is described by a set of item positions (slots).

### 1.1 Layouts

1. `single`
    - Positions: `Center`
    - Semantics: one image, full block, centered.
    - Visually: a single large tile.

2. `pairHorizontal`
    - Positions: `Left`, `Right`
    - Semantics: two images side by side.
    - Visually: left and right tiles of equal height.

3. `pairVertical`
    - Positions: `Up`, `Bottom`
    - Semantics: two images stacked vertically.
    - Visually: top and bottom tiles of equal width.

4. `triptychLeft`
    - Positions: `LS`, `RUC`, `RBC`
    - Semantics: “dominant” image on the left and two stacked images on the right.
    - Visually: large left column, two smaller right tiles (top and bottom).

5. `triptychRight`
    - Positions: `LUC`, `LBC`, `RS`
    - Semantics: two stacked images on the left and “dominant” image on the right.
    - Visually: two left tiles (top and bottom), large right column.

6. `triptychHorizontal`
    - Positions: `Left`, `Center`, `Right`
    - Semantics: three images in a row.
    - Visually: three equal-width tiles in a single horizontal line.

Each gallery layout is rendered by **GalleryComponent**, which maps an ordered list of `ItemPosition`s to visual slots (`gc-slot-*` class names). :contentReference[oaicite:0]{index=0}

## 2. Text Blocks

**Block kind:** `text`  
**Entity type:** `TextBlock`

Text block represents a piece of text with optional caption/title.

- Main text body: `body` (localized; currently we mostly use `body.en`).
- Optional title/caption: `caption` (localized).

Rendered by **TextBlockComponent** as two clickable areas:

- `.text-block-body` — main text area.
- `.text-title-body` — optional title/caption area, rendered only if `caption` exists. :contentReference[oaicite:1]{index=1}

## 3. CTA Blocks

**Block kind:** `cta`  
**Entity type:** `CtaBlock`

CTA block represents a call-to-action: button or banner that leads to some target (URL, email, booking page, etc.).

- Target: `target` object (contains at least `type`, possibly additional fields like `url` or `email`).
- Visual representation: one main clickable CTA area.

Rendered by **CtaBlockComponent** as a single clickable CTA surface. Current implementation uses a generic `.cta-block-placeholder` class that can be styled differently per target type later if needed. :contentReference[oaicite:2]{index=2}

## 4. Template Blocks

Template blocks are not stored as regular content; they are presets used on the **Blocks Page** to quickly create new blocks.

They are described by:

```ts
export const TEMPLATE_BLOCKS: TemplateBlock[] = [
    // --- Gallery layouts ---
    { kind: 'gallery', layout: 'single', label: 'Single' },
    { kind: 'gallery', layout: 'pairHorizontal', label: 'Pair (Horizontal)' },
    { kind: 'gallery', layout: 'pairVertical', label: 'Pair (Vertical)' },
    { kind: 'gallery', layout: 'triptychLeft', label: 'Triptych (Left)' },
    { kind: 'gallery', layout: 'triptychRight', label: 'Triptych (Right)' },
    { kind: 'gallery', layout: 'triptychHorizontal', label: 'Triptych (Horizontal)' },

    // --- Text block ---
    { kind: 'text', label: 'Text' },

    // --- CTA block ---
    { kind: 'cta', label: 'CTA' },
];
```
