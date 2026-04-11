// features/admin/eventPageEditor/ui/MediaSection.tsx
// Media picker fields for event pages.
// Supports: heroImage, experienceImages, resultsImages, featuredWorks.

import type { Localized } from '@/entities/common';
import { useStoreData } from '@/shared/state';
import { catalogStore, mediaItemsStore } from '@/shared/state/domain';
import { useEventPageEditorSession } from '../session/EventPageEditorSession.context';
import { isFieldVisible } from './fieldVisibility';
import type { SectionProps } from './sectionProps';

// ---------------------------------------------------------------------------
// Helpers — resolve visual ref from either media or art catalog store
// ---------------------------------------------------------------------------

function useVisualRefThumb(refId: string | undefined): string | undefined {
  const mediaCatalog = useStoreData(mediaItemsStore);
  const artCatalog = useStoreData(catalogStore);

  if (!refId) return undefined;

  // Try media items first
  const mediaItem = mediaCatalog?.items[refId];
  if (mediaItem && mediaItem.media.kind === 'image') {
    return mediaItem.media.sources.preview.jpeg ?? mediaItem.media.sources.full;
  }

  // Try art catalog
  const artItem = artCatalog?.items[refId];
  if (artItem?.images) {
    return artItem.images.preview?.jpeg ?? artItem.images.full;
  }

  return undefined;
}

function VisualThumb({ refId }: { refId: string }) {
  const url = useVisualRefThumb(refId);
  if (!url) return <span className="epe__media-id">{refId}</span>;
  return <img className="epe__media-thumb" src={url} alt="" loading="lazy" />;
}

// ---------------------------------------------------------------------------
// Hero Image (single MediaRef)
// ---------------------------------------------------------------------------

function HeroImageField({ record, set }: Pick<SectionProps, 'record' | 'set'>) {
  const { pickMedia, pickArt } = useEventPageEditorSession();
  const heroId = record.heroImage as string | undefined;
  const thumbUrl = useVisualRefThumb(heroId);

  return (
    <div className="epe__field">
      <label className="epe__label">Hero Image</label>
      {heroId ? (
        <div className="epe__media-preview">
          {thumbUrl && (
            <img className="epe__media-thumb" src={thumbUrl} alt="Hero preview" loading="lazy" />
          )}
          <div className="epe__media-info">
            <span className="epe__media-id">{heroId}</span>
            <div className="epe__media-actions">
              <button type="button" className="epe__btn epe__btn--secondary" onClick={() => pickMedia('heroImage', 'media')}>From Media</button>
              <button type="button" className="epe__btn epe__btn--secondary" onClick={() => pickArt('heroImage', 'media')}>From Catalog</button>
              <button type="button" className="epe__btn epe__btn--reset" onClick={() => set('heroImage', undefined)}>Clear</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="epe__media-actions">
          <button type="button" className="epe__btn epe__btn--secondary" onClick={() => pickMedia('heroImage', 'media')}>From Media</button>
          <button type="button" className="epe__btn epe__btn--secondary" onClick={() => pickArt('heroImage', 'media')}>From Catalog</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image Array (experienceImages, resultsImages)
// ---------------------------------------------------------------------------

function ImageArrayField({
  label,
  fieldName,
  record,
  set,
}: {
  label: string;
  fieldName: string;
  record: Record<string, unknown>;
  set: (field: string, value: unknown) => void;
}) {
  // Gallery images are primarily media (experience/results photos), art catalog is secondary
  const { pickMedia, pickArt } = useEventPageEditorSession();
  const images = (record[fieldName] as string[] | undefined) ?? [];

  const removeAt = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    set(fieldName, next.length > 0 ? next : undefined);
  };

  return (
    <div className="epe__field">
      <label className="epe__label">{label}</label>
      {images.length > 0 && (
        <div className="epe__media-list">
          {images.map((id, i) => (
            <div key={`${id}-${i}`} className="epe__media-list-item">
              <VisualThumb refId={id} />
              <button type="button" className="epe__btn epe__btn--reset" onClick={() => removeAt(i)} title="Remove">✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="epe__media-actions">
        <button type="button" className="epe__btn epe__btn--secondary" onClick={() => pickMedia(fieldName, 'media', 'append')}>+ From Media</button>
        <button type="button" className="epe__btn epe__btn--secondary" onClick={() => pickArt(fieldName, 'media', 'append')}>+ From Catalog</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Featured Works (CaptionedWork[])
// ---------------------------------------------------------------------------

interface CaptionedWorkItem {
  image: string;
  title: Localized;
  medium?: Localized;
}

function FeaturedWorksField({
  record,
  set,
}: {
  record: Record<string, unknown>;
  set: (field: string, value: unknown) => void;
}) {
  // Featured works are primarily artworks — art catalog is primary source, media is secondary
  const { pickMedia, pickArt } = useEventPageEditorSession();
  const works = (record.featuredWorks as CaptionedWorkItem[] | undefined) ?? [];

  const removeAt = (index: number) => {
    const next = works.filter((_, i) => i !== index);
    set('featuredWorks', next.length > 0 ? next : undefined);
  };

  const updateWork = (index: number, field: 'title' | 'medium', value: string) => {
    const next = works.map((w, i) => {
      if (i !== index) return w;
      return { ...w, [field]: value ? { ...(w[field] as Localized), en: value } : undefined };
    });
    set('featuredWorks', next);
  };

  return (
    <div className="epe__field">
      <label className="epe__label">Featured Works</label>
      {works.length > 0 && (
        <div className="epe__works-list">
          {works.map((work, i) => (
            <div key={`${work.image}-${i}`} className="epe__work-item">
              <div className="epe__work-image">
                <VisualThumb refId={work.image} />
              </div>
              <div className="epe__work-fields">
                <input
                  type="text"
                  value={work.title?.en ?? ''}
                  onChange={(e) => updateWork(i, 'title', e.target.value)}
                  placeholder="Title"
                  className="epe__work-input"
                />
                <input
                  type="text"
                  value={work.medium?.en ?? ''}
                  onChange={(e) => updateWork(i, 'medium', e.target.value)}
                  placeholder="Medium (e.g. Watercolor on paper, 76 x 56 cm)"
                  className="epe__work-input"
                />
              </div>
              <button
                type="button"
                className="epe__btn epe__btn--reset"
                onClick={() => removeAt(i)}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="epe__media-actions">
        <button type="button" className="epe__btn epe__btn--secondary" onClick={() => pickArt('featuredWorks', 'media', 'appendWork')}>+ From Catalog</button>
        <button type="button" className="epe__btn epe__btn--secondary" onClick={() => pickMedia('featuredWorks', 'media', 'appendWork')}>+ From Media</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section root
// ---------------------------------------------------------------------------

export function MediaSection({ preset, record, set }: SectionProps) {
  const heroVisible = isFieldVisible(preset, 'heroImage');
  const expVisible = isFieldVisible(preset, 'experienceImages');
  const resVisible = isFieldVisible(preset, 'resultsImages');
  const fwVisible = isFieldVisible(preset, 'featuredWorks');

  return (
    <div className="epe__section-body">
      {heroVisible && <HeroImageField record={record} set={set} />}
      {expVisible && (
        <ImageArrayField
          label="Experience Gallery"
          fieldName="experienceImages"
          record={record}
          set={set}
        />
      )}
      {resVisible && (
        <ImageArrayField
          label="Results Gallery"
          fieldName="resultsImages"
          record={record}
          set={set}
        />
      )}
      {fwVisible && <FeaturedWorksField record={record} set={set} />}
    </div>
  );
}
