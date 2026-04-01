# Sasha Gallery — Content & Composition Architecture (Draft)

## 1. Overview

This document defines the architectural model for content creation, 
composition, and rendering in **Sasha Gallery**.

The system is structured as a multi-layer architecture that separates:

* **Domain entities** (e.g. events)
* **Content assets** (e.g. artworks, media, text visuals)
* **Renderable representations**
* **Composition containers (blocks)**
* **Stream (presentation flow)**

---

## 2. Core Architectural Principle

> Content entities and composition containers must be strictly separated.
>
> Content is created as reusable assets.
> Composition is performed via generic layout blocks.
>
> Domain entities (e.g. events) do not act as content directly, but expose 
renderable projections.

---

## 3. Layered Architecture

```
+---------------------------+
|        STREAM LAYER       |
|  Ordered sequence of      |
|  blocks (presentation)    |
+------------+--------------+
             |
+------------v--------------+
|     COMPOSITION LAYER     |
|   Blocks with layouts     |
|   and slots               |
+------------+--------------+
             |
+------------v--------------+
|   RENDERABLE LAYER        |
|  Unified interface for    |
|  displayable entities     |
+------------+--------------+
             |
+------+--------------+-----+
| CONTENT ASSETS      |     |
| (visual entities)   |     |
|                     |     |
| - ArtItem           |     |
| - MediaItem         |     |
| - TextVisual        |     |
+--------------------+     |
                           |
+--------------------------v--+
|       DOMAIN LAYER           |
|       Business entities      |
|                              |
|       - Event                |
|                              |
| Event exposes renderable     |
| fragments into layer above   |
+------------------------------+
```

---

## 4. Content Asset Layer

### Definition

Content assets are **reusable, independently editable visual entities**.

### Types

* `ArtItem`
  Artwork with metadata (author, collection, etc.)

* `MediaItem`
  Images, videos, or other media resources

* `TextVisual` (a.k.a. EditorialCard / Postcard)
  A visual text composition rendered over a background

### Key Properties

* Stored independently
* Reusable across multiple blocks
* Editable without affecting composition structure
* Produce renderable representations

---

## 5. Domain Layer — Event

### Definition

`Event` is a **business entity**, not a content asset.

### Responsibilities

* Schedule (date/time)
* Pricing
* Availability
* Registration logic
* Status (open/closed/etc.)

### Important Rule

> Event must NOT be treated as a direct content element in composition.

---

## 6. Event → Presentation Mapping

Event exposes **renderable fragments** for use in composition.

### Examples of Event Fragments

* Title
* Schedule (date/time)
* Short description
* CTA (e.g. "Book", "Join")
* Status badge (e.g. "Sold out")
* Full event card / teaser

### Conceptual Model

```
Event
  ├── TitleFragment
  ├── ScheduleFragment
  ├── CTAFragment
  ├── DescriptionFragment
  └── EventCardFragment
```

### Notes

* Fragments may be:

  * computed on demand
  * cached projections
* They are NOT required to exist as persistent standalone entities

---

## 7. Renderable Layer

### Definition

A unified interface for anything that can be placed into a block.

### Renderable Types

* Art renderable
* Media renderable
* TextVisual renderable
* Event fragment renderable

### Purpose

> Normalize different entity types into a single interface for 
composition.

---

## 8. Composition Layer (Blocks)

### Definition

Blocks are **layout containers**, not content.

### Responsibilities

* Define layout template
* Provide slots
* Control visual arrangement
* Apply styling and appearance rules

### Structure

```
Block
  - layoutType
  - slots[]
  - appearanceSettings
```

### Slot Binding

Each slot is bound to a renderable:

```
Slot A → ArtItem
Slot B → TextVisual
Slot C → Event CTA Fragment
```

### Key Principle

> Blocks compose content, but do not own it.

---

## 9. Stream Layer

### Definition

Stream is an ordered sequence of blocks forming the final user-facing 
flow.

### Responsibilities

* Ordering
* Visibility
* Publication state
* Navigation logic

### Important Rule

> Stream does not manage content semantics — only presentation order.

---

## 10. TextVisual (Editorial Card) — UI Flow

### Creation Flow

1. Select background:

   * image
   * color
   * gradient

2. Enter text:

   * title
   * subtitle / body
   * optional caption

3. Typography settings:

   * font family
   * size
   * weight
   * alignment
   * line height

4. Layout:

   * text bounding box
   * position
   * width/height
   * padding

5. Readability controls:

   * overlay
   * dimming
   * blur
   * shadow

6. Save as asset

### Output

A reusable `TextVisual` asset.

---

## 11. Data Flow

### A. Authoring

```
User → creates TextVisual / ArtItem / MediaItem / Event
```

### B. Composition

```
User → creates Block
Block → binds slots to renderables
```

### C. Presentation

```
Stream → orders Blocks
Blocks → render content via renderables
```

---

## 12. Key Design Rules

### Rule 1 — Create Once, Use Many

Content assets are reusable across multiple blocks.

### Rule 2 — No Specialized Text Blocks

Text is not a block type; it is a content asset (`TextVisual`).

### Rule 3 — Event Is Not Content

Event remains a domain entity and only exposes presentation fragments.

### Rule 4 — Composition Is Generic

Blocks must support heterogeneous content types.

### Rule 5 — Separation of Concerns

* Content ≠ Layout
* Domain ≠ Presentation

---

## 13. Summary

This architecture transforms Sasha Gallery into:

> A visual composition system built on reusable assets and generic layout 
containers,
> rather than a collection of specialized block types.

---



