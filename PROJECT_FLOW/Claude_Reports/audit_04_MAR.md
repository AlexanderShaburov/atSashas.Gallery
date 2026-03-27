---


# TASK: Implement Unified Renderer + Advanced Frame Editing for Gallery Blocks

## Context

The project already has a **rendering mechanism** used to display blocks.

From now on, **all visual representations must use the same renderer**, including:

- Blocks on the public page
- Blocks in preview mode
- Block thumbnails
- Stream thumbnails / miniatures
- Tiles used in pickers and lists

There must **not be multiple rendering systems**.  
Miniatures and tiles must be rendered through the same renderer with different render contexts.

---

# PART 1 — Renderer Unification

## Goal

All visual content must render through the **same rendering pipeline**.

### The following must use the renderer:

- Blocks
- Stream thumbnails
- Block thumbnails
- Tiles in selectors
- Any preview representation

### Implementation requirement

The renderer must support different **render contexts**, for example:

public
preview
edit
thumbnail
tile

Each context may apply different constraints but must reuse the same layout logic.

Example concept:

Renderer(renderable, context="thumbnail")

### Rules

1. Layout logic must exist only once.
2. Thumbnail rendering must not duplicate layout code.
3. Edit overlays must only appear in `edit` context.
4. Thumbnail/tile contexts must disable editing overlays.

### Acceptance criteria

- Stream thumbnails use the renderer.
- Block thumbnails use the renderer.
- Tiles use the renderer.
- Layout behavior remains consistent across contexts.

---

# PART 2 — Frame Edit Mode in Block Editor

## Goal

Introduce a **Frame Edit Mode** that allows interactive editing of gallery layouts.

Add a **toolbar button** in the Block Editor:

Frame Edit

When enabled, the editor activates advanced editing capabilities for image frames.

---

# Frame Edit Mode behavior

When enabled:

- frames are highlighted
- drag handles appear
- frames can be resized
- images can be cropped
- captions can be edited
- frames can be repositioned

When disabled:

- the block behaves normally
- no editing overlays appear

The toggle must **not modify data**, it only enables editing tools.

---

# PART 3 — Frame Resize (Layout Geometry Editing)

## Goal

Allow users to change **relative frame proportions**.

Example layouts affected:

- pair vertical
- triptychLeft
- triptychRight
- other multi-image layouts

### Expected behavior

Users can drag boundaries between frames.

Examples:

Pair layout:

| image A | image B |

User can move the divider:

| A wider | B |

Triptych:

| large | small |
| large | small |

User can change the size of the smaller images.

### Implementation requirement

Layout proportions must be stored as **layout geometry parameters**, not hardcoded styles.

Example parameters:

splitRatio
topRatio
bottomRatio
sidebarRatio

Each parameter must have limits:

min = 0.15
max = 0.85

### UI

Resize handles must appear on frame borders.

Dragging must update layout **in real time**.

### Acceptance criteria

- Resizing changes frame proportions.
- Changes persist in block data.
- Public rendering reproduces the same layout.

---

# PART 4 — Frame Offset / Position Editing

## Goal

Allow users to shift frames relative to each other.

Example:

A top-left frame can be moved slightly upward or downward relative to another frame.

This changes the visual composition.

### Implementation

Frames may support optional offsets:

offsetX
offsetY

Offsets must be relative values.

They must be clamped so frames cannot disappear completely.

### Interaction

In Frame Edit Mode:

- dragging a frame moves its offset
- snapping may be added later

### Acceptance criteria

- Frames can be repositioned.
- Layout remains stable.
- Offsets persist in saved data.

---

# PART 5 — Image Crop / Zoom / Pan

## Goal

Allow cropping by manipulating the image inside the frame.

Users must be able to:

- zoom image
- pan image
- change visible portion

### Controls

Zoom:

- mouse wheel
- trackpad
-   - / – overlay buttons

Pan:

- drag image inside frame

### Implementation

Store transform parameters:

scale
centerX
centerY

or

scale
translateX
translateY

Rendering must use:

overflow: hidden
transform: translate(...) scale(...)

### Acceptance criteria

- zoom and pan work smoothly
- cropping persists in saved data
- crop remains correct after resizing frames

---

# PART 6 — Caption Editing

## Goal

Allow captions on images.

Captions must support:

- text editing
- font selection
- font size
- color
- position
- background panel

### Font rules

Fonts must come from a **fixed project whitelist**.

Do not use arbitrary system fonts.

Example:

fontFamilyId

### Caption data model

Suggested structure:

caption {
enabled
text
fontFamilyId
fontSize
color
position { x, y }
background {
enabled
opacity
}
}

### Interaction

In Frame Edit Mode:

- captions can be dragged to change position
- font can be changed from dropdown
- size and color adjustable

### Acceptance criteria

- captions render identically in public and preview
- fonts load from project resources
- captions remain anchored to images

---

# PART 7 — Data Model and Backward Compatibility

All new fields must be **optional**.

Existing blocks must continue working.

Default values must be applied when fields are missing.

Examples:

scale = 1
center = 0.5 / 0.5
offsetX = 0
offsetY = 0

---

# PART 8 — Implementation Order

Implement features in the following order:

1. Renderer unification
2. Frame Edit Mode toggle
3. Crop (zoom/pan)
4. Frame resize (layout geometry)
5. Captions
6. Frame offsets

This order reduces architectural risk.

---

# Final Acceptance Criteria

The following must be true:

- All blocks, tiles, and stream thumbnails render via the renderer.
- Frame Edit Mode exists in the Block Editor.
- Frames can be resized.
- Images can be cropped.
- Captions can be edited.
- Layout changes persist.
- Public rendering reproduces editor results.
- Existing data remains compatible.
