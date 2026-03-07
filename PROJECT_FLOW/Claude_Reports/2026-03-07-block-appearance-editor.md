# Block Appearance Editor — Implementation Report

**Date:** 2026-03-07
**Branch:** release-mvp
**Commits:** 6dd9173..fbf7f7d (11 commits)
**Plan:** Docs/plans/2026-03-07-block-appearance-editor.md
**Spec:** Docs/plans/block_appearance_editor_spec.md

## Summary

Implemented per-block visual customization for gallery blocks, giving artists control over column proportions, image zoom/pan/frame offset, gap, vertical alignment, and caption styling. The feature is accessed via a "Customize" sub-mode in the block editor.

## What was built

### Data model (entities layer)

- **`appearance.types.ts`** — 6 types: `ImageAppearance`, `CaptionStyle`, `SlotCaptionAppearance`, `SlotAppearance`, `BlockCaptionAppearance`, `BlockAppearance`
- **`appearance.defaults.ts`** — 12 constants (scale/gap/font-size limits), 6 factory functions, field-by-field `isDefaultAppearance` comparator
- Added `appearance?: BlockAppearance` to `GalleryBlock` interface

### Shared infrastructure

- **`shared/lib/fonts/galleryFonts.ts`** — 12 curated Google Fonts for art gallery aesthetic
- **`shared/lib/fonts/loadGoogleFont.ts`** — Dynamic font loading via `<link>` injection with dedup
- **`shared/lib/colors/siteColorPalette.ts`** — 9 site CSS variable colors for caption color picker

### Public renderer

- **`applyAppearanceStyles.ts`** — 3 pure functions: `blockGridStyle`, `slotWrapperStyle`, `slotImageStyle`
- **`ImageComponent.tsx`** — Slot wrapper divs, appearance-driven grid/image transforms, block + slot caption rendering with font loading
- **`Gallery.css`** — Slot wrapper styles, caption positioning, mobile `block--custom` override at 820px

### Admin editor

- **`GalleryComponent.tsx`** — Applies appearance in editor context, ignores in grid/thumbnail context
- **Toolbar system** — Added `'customize'` ToolKey, `CustomizeButton`, registered in TOOL_REGISTRY and TOOL_GROUPS
- **Block editor session** — `enterCustomize`/`exitCustomize` mode stack management, `appearanceDraft` state, `saveAppearance` handler with API persistence, dirty check on exit

### BlockCustomizer (interactive editing)

- **`BlockCustomizer.tsx`** — Main component: renders gallery block with interactive overlays + control panels
- **`useColumnDrag.ts`** — Draggable column dividers adjusting `columnRatios` with MIN_COLUMN_RATIO enforcement
- **`useSlotInteraction.ts`** — Wheel zoom (0.5-2.0), pointer pan, frame vertical drag per slot
- **`useCaptionDrag.ts`** — Pointer-based drag for slot caption XY positioning
- **`ControlPanel.tsx`** — Gap slider, vertical align picker, per-slot zoom/pan reset, reset-all-to-defaults
- **`CaptionControls.tsx`** — Block caption position (above/below) + style, per-slot visibility toggle + font/size/color
- **`FontPicker.tsx`** — Dropdown from GALLERY_FONTS with dynamic loading on change
- **`ColorPicker.tsx`** — Site palette swatches + native color input

### Safety

- **Image replacement warning** — When inserting new art into a slot with custom appearance, prompts user to keep or reset

## Files changed

**33 files** — 1,583 lines added, 57 removed

### Created (18 files)

| File | Purpose |
|------|---------|
| `entities/block/appearance.types.ts` | Appearance type definitions |
| `entities/block/appearance.defaults.ts` | Constants, factories, comparator |
| `shared/lib/fonts/galleryFonts.ts` | Curated font list |
| `shared/lib/fonts/loadGoogleFont.ts` | Dynamic font loader |
| `shared/lib/colors/siteColorPalette.ts` | Site color palette |
| `public/ui/Image/applyAppearanceStyles.ts` | Style computation functions |
| `admin/blocks/ui/BlockCustomizer/BlockCustomizer.tsx` | Main customizer component |
| `admin/blocks/ui/BlockCustomizer/BlockCustomizer.css` | Customizer styles |
| `admin/blocks/ui/BlockCustomizer/useColumnDrag.ts` | Column drag hook |
| `admin/blocks/ui/BlockCustomizer/useSlotInteraction.ts` | Zoom/pan/frame hook |
| `admin/blocks/ui/BlockCustomizer/useCaptionDrag.ts` | Caption drag hook |
| `admin/blocks/ui/BlockCustomizer/ControlPanel.tsx` | Gap/align/reset controls |
| `admin/blocks/ui/BlockCustomizer/ControlPanel.css` | Control panel styles |
| `admin/blocks/ui/BlockCustomizer/CaptionControls.tsx` | Caption styling controls |
| `admin/blocks/ui/BlockCustomizer/CaptionControls.css` | Caption controls styles |
| `admin/blocks/ui/BlockCustomizer/FontPicker.tsx` | Font dropdown |
| `admin/blocks/ui/BlockCustomizer/ColorPicker.tsx` | Color swatch + input |
| `admin/blocks/ui/BlockCustomizer/ColorPicker.css` | Color picker styles |

### Modified (15 files)

| File | Change |
|------|--------|
| `entities/block/block.types.ts` | Added `appearance?` to GalleryBlock |
| `entities/block/block-editor-screen.types.ts` | Added `'customize'` mode |
| `entities/block/index.ts` | Re-exports for all appearance types/functions |
| `shared/ui/ArtPicture/ArtPicture.tsx` | Added `imgStyle` prop |
| `shared/ui/SingleEditorToolbar/*` (4 files) | Customize button registration |
| `admin/blocks/blockEditorSession/block-editor.types.ts` | Session interface extension |
| `admin/blocks/blockEditorSession/BlockEditorSession.context.tsx` | Customize mode + image replacement warning |
| `admin/blocks/BlockEditorScreen/BlockEditorScreen.tsx` | Customize mode rendering |
| `admin/blocks/ui/SingleBlockEditor/SingleBlockEditor.tsx` | Toolbar wiring |
| `admin/shared/ui/BlockPreview/GalleryComponent.tsx` | Appearance in editor preview |
| `public/ui/Image/ImageComponent.tsx` | Slot wrappers + caption rendering |
| `public/ui/GalleryBlock/Gallery.css` | Slot styles + mobile override |

## Commit log

```
fbf7f7d style: fix Prettier formatting on font and color palette files
a77d144 feat: warn on image replacement in slot with custom appearance
0cf5a6e feat: add caption customization UI — font, size, color, position, drag
d251ae4 feat: add gap slider, vertical align, reset, and snap-to-natural controls
52c0dfa feat: add zoom, pan, and frame vertical drag to BlockCustomizer
abd803d feat: add BlockCustomizer with interactive column divider drag
188d19f feat: add Customize toolbar button and block editor customize mode
d332a07 feat: apply BlockAppearance in admin editor preview
4ca68d1 feat: add slot wrappers and appearance rendering to public gallery
1104345 feat: add Google Fonts list, font loader, and site color palette
6dd9173 feat: add BlockAppearance data model with types and defaults factory
```

## Verification

- TypeScript type-check: 0 new errors (29 pre-existing in unrelated WIP files)
- Prettier: clean on all new/modified files
- Architecture compliance: customize sub-mode follows Constitution Section 3 (editor architecture) and Section 7 (standard UI mechanisms)

## Known limitations / future work

- Caption `CaptionStyle` type (font/size/color) will need reconciliation with WIP GalleryRenderer's expected `CaptionStyle` when that renderer is completed
- Stale closure pattern in drag hooks (useSlotInteraction, useCaptionDrag) — works correctly for single-gesture scenarios but could be fragile if concurrent gestures occur; consider ref-based approach if issues arise
- No undo/redo for appearance changes (not in spec)
- No copy/paste appearance between blocks (explicitly excluded from spec)
