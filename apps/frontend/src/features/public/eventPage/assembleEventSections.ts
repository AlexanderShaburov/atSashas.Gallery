// features/public/eventPage/assembleEventSections.ts
// Core assembly logic: determines which sections render for a given event.
// Pure function — no React, no DOM, no side effects.

import type { EventRenderContext } from '@/entities/event/eventRenderContext';
import type { ResolvedEventPageData } from '@/entities/event/eventPage.types';

import {
  PRESET_SECTION_MAP,
  QUICK_FACTS_SOURCES,
  SECTION_CONTRACTS,
} from './contracts';
import type { PresetSectionSlot, SectionKind } from './contracts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RenderMode = 'production' | 'development' | 'editorPreview';

export interface AssemblyOptions {
  mode?: RenderMode;
}

export type SectionStatus =
  | 'rendered'
  | 'skipped-optional'
  | 'skipped-error'
  | 'error-placeholder'
  | 'editor-placeholder';

export interface SectionOutput {
  kind: SectionKind;
  status: SectionStatus;
  importance: 'required' | 'strong' | 'optional';
}

// ---------------------------------------------------------------------------
// Field presence check
// ---------------------------------------------------------------------------

/**
 * "Has content" check used to decide whether a section's source field
 * counts as populated.
 *
 * Critical detail: backend Pydantic `Localized` always serializes its
 * five locale fields and defaults unset ones to `null`. The wire shape
 * for an empty title is `{en:null, ru:null, it:null, es:null, pt:null}`
 * — five keys, no content. The previous implementation checked
 * `Object.keys(value).length > 0`, which reported these as present and
 * let downstream rendering produce empty-text sections.
 *
 * `hasField` now reports `true` only if some leaf is genuinely
 * content-bearing (non-empty string, non-null primitive, non-empty
 * array). Empty objects, all-null Localized objects, and empty strings
 * are all treated as missing.
 */
function hasField(event: Record<string, unknown>, field: string): boolean {
  return hasContent(event[field]);
}

function hasContent(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    const values = Object.values(value as Record<string, unknown>);
    if (values.length === 0) return false;
    return values.some((v) => hasContent(v));
  }
  if (typeof value === 'string') return value.length > 0;
  // Numbers / booleans are content-bearing (e.g. price.amount === 0,
  // capacity === 0 are still meaningful values).
  return true;
}

function getSourceFields(
  slot: PresetSectionSlot,
  preset: string,
): string[] {
  // QuickFacts: use preset-specific source fields
  if (slot.section === 'quickFacts') {
    if (preset === 'workshop' || preset === 'pleinAir') {
      return QUICK_FACTS_SOURCES[preset];
    }
    return [];
  }

  // Source field override (e.g. Minimal description → extendedDescription)
  if (slot.sourceFieldOverride) {
    return [slot.sourceFieldOverride];
  }

  return SECTION_CONTRACTS[slot.section].sourceFields;
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

export function assembleEventSections(
  event: ResolvedEventPageData,
  _context: EventRenderContext,
  options?: AssemblyOptions,
): SectionOutput[] {
  const mode = options?.mode ?? 'production';
  const sections = PRESET_SECTION_MAP[event.preset];
  if (!sections) return [];

  const eventRecord = event as unknown as Record<string, unknown>;
  const results: SectionOutput[] = [];

  for (const slot of sections) {
    const sourceFields = getSourceFields(slot, event.preset);
    const allPresent = sourceFields.every((f) => hasField(eventRecord, f));
    const anyPresent = sourceFields.some((f) => hasField(eventRecord, f));

    if (allPresent) {
      results.push({ kind: slot.section, status: 'rendered', importance: slot.importance });
      continue;
    }

    // Data is partially or fully missing.
    if (slot.importance === 'required') {
      // Author-preview parity: production, editorPreview, and development
      // all render a required section with whatever data IS present, so
      // the public page matches what the author saw in editor preview.
      // Section components read each field defensively (empty strings,
      // null images) and lay out the structure cleanly.
      //
      // The only divergence between modes is what happens when every
      // source field is empty:
      //   editorPreview → editor-placeholder (visible to author)
      //   development   → error-placeholder  (visible to dev, plus log)
      //   production    → skip silently      (don't ship empty sections)
      //
      // Rationale: the previous strict allPresent rule for production
      // left workshops with one missing field (e.g. duration, or a
      // null-Localized title from a Pydantic round-trip) rendering as
      // bare title + galleries on the public page while the editor
      // preview showed a complete hero / quickFacts / cta layout.
      if (anyPresent) {
        results.push({
          kind: slot.section,
          status: 'rendered',
          importance: slot.importance,
        });
        continue;
      }

      // Every source field is empty.
      if (mode === 'editorPreview') {
        results.push({
          kind: slot.section,
          status: 'editor-placeholder',
          importance: slot.importance,
        });
        continue;
      }

      const missing = sourceFields.filter((f) => !hasField(eventRecord, f));
      console.error(
        `[EventPage] Section "${slot.section}" missing required fields: ${missing.join(', ')} (event ${event.id})`,
      );

      if (mode === 'development') {
        results.push({
          kind: slot.section,
          status: 'error-placeholder',
          importance: slot.importance,
        });
      }
      // production: skip silently (error already logged)
      continue;
    }

    // strong or optional: skip entirely
    results.push({ kind: slot.section, status: 'skipped-optional', importance: slot.importance });
  }

  return results;
}

/** Returns only the sections that should be rendered (excludes skipped). */
export function getRenderedSections(outputs: SectionOutput[]): SectionOutput[] {
  return outputs.filter(
    (s) =>
      s.status === 'rendered' ||
      s.status === 'error-placeholder' ||
      s.status === 'editor-placeholder',
  );
}
