// features/admin/mediaEditor/ui/MediaEditForm.tsx

import type { Localized } from '@/entities/common';
import type { MediaItemData } from '@/entities/mediaItem';
import { useMediaEditorSession } from '../mediaEditorSession/MediaEditorSession.context';

/** Resolve best thumbnail for preview (jpeg → full), matching MediaRenderableView pattern. */
function resolvePreviewUrl(item: MediaItemData): string | undefined {
  if (item.media.kind === 'image') {
    return item.media.sources.preview.jpeg ?? item.media.sources.full;
  }
  if (item.media.kind === 'video') {
    return item.media.sources.posterUrl;
  }
  return undefined;
}

function DependencyBlockDialog() {
  const { deletionBlock, dismissDeletionBlock } = useMediaEditorSession();
  if (!deletionBlock) return null;

  return (
    <div className="media-dep-dialog__overlay">
      <div className="media-dep-dialog">
        <h3 className="media-dep-dialog__title">Cannot delete</h3>
        <p className="media-dep-dialog__desc">
          This media item is referenced by {deletionBlock.deps.length} dependenc
          {deletionBlock.deps.length === 1 ? 'y' : 'ies'}:
        </p>
        <ul className="media-dep-dialog__list">
          {deletionBlock.deps.map((dep, i) => (
            <li key={i} className="media-dep-dialog__item">
              <span className="media-dep-dialog__kind">
                {dep.entityKind === 'block' ? 'Block' : 'Event page'}
              </span>
              <span className="media-dep-dialog__name">{dep.entityTitle}</span>
              <span className="media-dep-dialog__field">{dep.field}</span>
            </li>
          ))}
        </ul>
        <p className="media-dep-dialog__hint">
          Remove references in the listed items before deleting.
        </p>
        <button
          type="button"
          className="media-dep-dialog__close"
          onClick={dismissDeletionBlock}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export function MediaEditForm() {
  const {
    draft, isDirty, isValid, isSaving, screenMode, deletionBlock,
    setDraftField, save, deleteItem, back,
  } = useMediaEditorSession();
  const isCreate = screenMode === 'create';
  const canDelete = screenMode === 'edit' && !isSaving;

  if (!draft) {
    return <div className="media-editor__loading">No draft loaded.</div>;
  }

  const previewUrl = resolvePreviewUrl(draft);

  const onLocalizedChange = (field: 'title' | 'alt', raw: string) => {
    const prev: Localized | undefined = draft[field];
    setDraftField(field, { ...prev, en: raw });
  };

  const onTagsChange = (raw: string) => {
    const tags = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    setDraftField('tags', tags);
  };

  return (
    <div className="media-edit-form">
      <div className="media-edit-form__header">
        <h2 className="media-edit-form__title">{isCreate ? 'New Media Item' : 'Edit Media Item'}</h2>
        <div className="media-edit-form__status">
          {isDirty && <span className="media-edit-form__dirty-badge">Modified</span>}
          {!isValid && <span className="media-edit-form__invalid-badge">Invalid</span>}
        </div>
      </div>

      <div className="media-edit-form__layout">
        {/* Preview */}
        <div className="media-edit-form__preview">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" loading="lazy" />
          ) : (
            <div className="media-edit-form__no-preview">No preview available</div>
          )}
          <div className="media-edit-form__meta">
            <span className="media-edit-form__id">{draft.id}</span>
            <span className="media-edit-form__kind">{draft.media.kind}</span>
            <span className="media-edit-form__lifecycle">{draft.lifecycle}</span>
            {draft.dimensions && (
              <span className="media-edit-form__dimensions">
                {draft.dimensions.width} x {draft.dimensions.height}
              </span>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="media-edit-form__fields">
          <div className="media-edit-form__field">
            <label>Title (EN)</label>
            <input
              type="text"
              value={draft.title?.en ?? ''}
              onChange={(e) => onLocalizedChange('title', e.target.value)}
              placeholder="Title"
            />
          </div>

          <div className="media-edit-form__field">
            <label>Alt text (EN)</label>
            <input
              type="text"
              value={draft.alt?.en ?? ''}
              onChange={(e) => onLocalizedChange('alt', e.target.value)}
              placeholder="Alt text for accessibility"
            />
          </div>

          <div className="media-edit-form__field">
            <label>Tags</label>
            <input
              type="text"
              value={(draft.tags ?? []).join(', ')}
              onChange={(e) => onTagsChange(e.target.value)}
              placeholder="nature, landscape, workshop"
            />
          </div>
        </div>
      </div>

      <div className="media-edit-form__toolbar">
        <button type="button" className="media-edit-form__back" onClick={back}>
          Cancel
        </button>
        <button
          type="button"
          className="media-edit-form__save"
          disabled={(!isDirty && !isCreate) || !isValid || isSaving}
          onClick={() => void save()}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        {canDelete && (
          <button
            type="button"
            className="media-edit-form__delete"
            onClick={() => void deleteItem()}
          >
            Delete
          </button>
        )}
      </div>

      {deletionBlock && <DependencyBlockDialog />}
    </div>
  );
}
