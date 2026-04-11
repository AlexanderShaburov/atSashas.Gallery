// features/admin/eventPageEditor/ui/EventPageEditor.tsx
// Event Page Editor — Phase 2: section-based edit UI.
// Modes: select → create → edit (with sidebar sections) → preview.

import { useCallback, useEffect, useState } from 'react';
import type { EventPreset } from '@/entities/event';
import { EVENT_PRESETS } from '@/entities/event';
import type { MediaItemData } from '@/entities/mediaItem';
import { resolveEventDefaults } from '@/entities/event/resolveEventDefaults';
import { buildEventRenderContext } from '@/entities/event/eventRenderContext';
import { mapEventToRenderModel } from '@/features/public/eventPage/mapEventToRenderModel';
import { EventPageView } from '@/features/public/eventPage/EventPageView';
import { useStoreData } from '@/shared/state';
import { catalogStore, mediaItemsStore } from '@/shared/state/domain';
import { useEventPageEditorSession } from '../session/EventPageEditorSession.context';
import { ContentSection } from './ContentSection';
import { LogisticsSection } from './LogisticsSection';
import { CtaSection } from './CtaSection';
import { SettingsSection } from './SettingsSection';
import { MediaSection } from './MediaSection';
import './EventPageEditor.css';

// ---------------------------------------------------------------------------
// Preset metadata
// ---------------------------------------------------------------------------

const PRESET_META: Record<EventPreset, { label: string; tagline: string }> = {
  workshop: { label: 'Workshop', tagline: 'Hands-on experience with materials and techniques' },
  pleinAir: { label: 'Plein Air', tagline: 'Multi-session outdoor painting adventure' },
  exhibition: { label: 'Exhibition', tagline: 'Curated showing of artworks' },
  minimal: { label: 'Minimal', tagline: 'Simple event with essential details' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function localizedEn(loc: { en?: string } | undefined): string {
  if (!loc) return '';
  return loc.en ?? '';
}

// ---------------------------------------------------------------------------
// Editor sections
// ---------------------------------------------------------------------------

type EditorSection = 'content' | 'logistics' | 'cta' | 'media' | 'settings';

const SECTION_LABELS: Record<EditorSection, string> = {
  content: 'Content',
  logistics: 'Schedule & Venue',
  cta: 'CTA',
  media: 'Media',
  settings: 'Settings',
};

const SECTION_ORDER: EditorSection[] = ['content', 'logistics', 'cta', 'media', 'settings'];

// ---------------------------------------------------------------------------
// Select Mode
// ---------------------------------------------------------------------------

function useHeroThumb(heroRef: string | undefined): string | undefined {
  const mediaCat = useStoreData(mediaItemsStore);
  const artCat = useStoreData(catalogStore);
  if (!heroRef) return undefined;
  const mi = mediaCat?.items[heroRef];
  if (mi?.media.kind === 'image') return mi.media.sources.preview.jpeg ?? mi.media.sources.full;
  const ai = artCat?.items[heroRef];
  if (ai?.images) return ai.images.preview?.jpeg ?? ai.images.full;
  return undefined;
}

function EventTile({ page, onClick }: { page: { id: string; preset: string; status: string; title: { en?: string }; heroImage?: string }; onClick: () => void }) {
  const heroUrl = useHeroThumb(page.heroImage);

  return (
    <div className={`epe__card ${heroUrl ? 'epe__card--has-hero' : ''}`} onClick={onClick}>
      {heroUrl && (
        <div className="epe__card-hero">
          <img src={heroUrl} alt="" loading="lazy" />
        </div>
      )}
      <div className="epe__card-body">
        <div className="epe__card-badges">
          <span className={`epe__badge epe__badge--${page.preset}`}>{page.preset}</span>
          <span className={`epe__badge epe__badge--${page.status}`}>{page.status}</span>
        </div>
        <h3 className="epe__card-title">{localizedEn(page.title) || 'Untitled'}</h3>
      </div>
    </div>
  );
}

function SelectMode() {
  const { pages, isLoading, pushMode, selectEvent, isJourney, selectAndReturn, cancelSelect } =
    useEventPageEditorSession();

  if (isLoading) return <div className="epe__loading">Loading event pages...</div>;

  return (
    <div className="epe__select">
      <div className="epe__header">
        <h1 className="epe__title">Events</h1>
        <div className="epe__actions">
          <button className="epe__btn epe__btn--primary" onClick={() => pushMode('create')}>
            New Event Page
          </button>
          {isJourney && (
            <button className="epe__btn epe__btn--secondary" onClick={cancelSelect}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="epe__empty">No event pages yet.</div>
      ) : (
        <div className="epe__grid">
          {pages.map((page) => (
            <EventTile
              key={page.id}
              page={page as { id: string; preset: string; status: string; title: { en?: string }; heroImage?: string }}
              onClick={() => (isJourney ? selectAndReturn(page.id) : selectEvent(page.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Mode
// ---------------------------------------------------------------------------

function CreateMode() {
  const { createNew, back } = useEventPageEditorSession();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') back();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [back]);

  return (
    <div className="epe__create">
      <div className="epe__header">
        <button className="epe__btn epe__btn--secondary" onClick={back}>← Back</button>
        <h1 className="epe__title">Choose Event Type</h1>
      </div>
      <div className="epe__preset-grid">
        {EVENT_PRESETS.map((preset) => {
          const meta = PRESET_META[preset];
          return (
            <button
              key={preset}
              className="epe__preset-card"
              onClick={() => createNew(preset)}
            >
              <span className={`epe__badge epe__badge--${preset}`}>{meta.label}</span>
              <p className="epe__preset-tagline">{meta.tagline}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Mode — sidebar + section panel
// ---------------------------------------------------------------------------

function EditMode() {
  const { draft, isDirty, isSaving, setDraftField, save, deleteEvent, back, pushMode, consumeRestoredSection } =
    useEventPageEditorSession();
  const [activeSection, setActiveSection] = useState<EditorSection>(() => {
    const restored = consumeRestoredSection();
    return (restored as EditorSection) || 'content';
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') back();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [back]);

  if (!draft) return <div className="epe__loading">No draft loaded.</div>;

  const preset = draft.preset;
  const record = draft as unknown as Record<string, unknown>;
  const sectionProps = { preset, record, set: setDraftField };

  return (
    <div className="epe__edit">
      {/* ── Toolbar ── */}
      <div className="epe__toolbar">
        <button className="epe__btn epe__btn--secondary" onClick={back}>← Exit</button>
        <span className="epe__toolbar-title">{localizedEn(draft.title) || 'Untitled'}</span>
        <span className={`epe__badge epe__badge--${preset}`}>{preset}</span>
        {isDirty && <span className="epe__dirty-dot" title="Unsaved changes" />}
        <div className="epe__toolbar-actions">
          <button
            className="epe__btn epe__btn--danger"
            onClick={() => void deleteEvent(draft.id)}
            disabled={isSaving}
          >
            Delete
          </button>
          <button className="epe__btn epe__btn--secondary" onClick={() => pushMode('preview')}>
            Preview
          </button>
          <button className="epe__btn epe__btn--primary" onClick={save} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Sidebar + Panel ── */}
      <div className="epe__edit-body">
        <nav className="epe__sidebar">
          {SECTION_ORDER.map((section) => (
            <button
              key={section}
              className={`epe__sidebar-tab ${activeSection === section ? 'epe__sidebar-tab--active' : ''}`}
              onClick={() => setActiveSection(section)}
            >
              {SECTION_LABELS[section]}
            </button>
          ))}
        </nav>

        <div className="epe__panel">
          <h2 className="epe__section-title">{SECTION_LABELS[activeSection]}</h2>
          {activeSection === 'content' && <ContentSection {...sectionProps} />}
          {activeSection === 'logistics' && <LogisticsSection {...sectionProps} />}
          {activeSection === 'cta' && <CtaSection {...sectionProps} />}
          {activeSection === 'media' && <MediaSection {...sectionProps} />}
          {activeSection === 'settings' && <SettingsSection {...sectionProps} />}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview Mode
// ---------------------------------------------------------------------------

function mediaRefToUrl(item: MediaItemData): string | null {
  if (item.media.kind === 'image') {
    return item.media.sources.preview.jpeg ?? item.media.sources.full ?? null;
  }
  if (item.media.kind === 'video') {
    return item.media.sources.posterUrl ?? null;
  }
  return null;
}

function PreviewMode() {
  const { draft, back } = useEventPageEditorSession();
  const mediaCatalog = useStoreData(mediaItemsStore);
  const artCatalog = useStoreData(catalogStore);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') back();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [back]);

  const resolveMediaUrl = useCallback(
    (ref: string): string | null => {
      // Try media items
      const mediaItem = mediaCatalog?.items[ref];
      if (mediaItem) return mediaRefToUrl(mediaItem);
      // Try art catalog
      const artItem = artCatalog?.items[ref];
      if (artItem?.images) return artItem.images.preview?.jpeg ?? artItem.images.full ?? null;
      return null;
    },
    [mediaCatalog, artCatalog],
  );

  const handlePreviewCta = useCallback(() => {
    const status = draft?.status ?? 'draft';
    if (status === 'scheduled') {
      alert('CTA is active. Visitors will see the enrollment form here.');
    } else {
      alert(`CTA is inactive (status: ${status}). Set status to "scheduled" to enable enrollment.`);
    }
  }, [draft?.status]);

  if (!draft) return <div className="epe__loading">No draft to preview.</div>;

  const resolved = resolveEventDefaults(draft);
  const context = buildEventRenderContext(draft);
  const model = mapEventToRenderModel(resolved, context, {
    mode: 'editorPreview',
    resolveMediaUrl,
  });

  return (
    <div className="epe__preview">
      <div className="epe__preview-toolbar">
        <button className="epe__btn epe__btn--secondary" onClick={back}>← Back to Editor</button>
        <span className="epe__preview-label">Draft Preview</span>
        <span className={`epe__badge epe__badge--${draft.preset}`}>{draft.preset}</span>
      </div>
      <div className="epe__preview-frame">
        <EventPageView model={model} onCtaClick={handlePreviewCta} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function EventPageEditor() {
  const { screenMode } = useEventPageEditorSession();

  switch (screenMode) {
    case 'select':
      return <SelectMode />;
    case 'create':
      return <CreateMode />;
    case 'edit':
      return <EditMode />;
    case 'preview':
      return <PreviewMode />;
  }
}
