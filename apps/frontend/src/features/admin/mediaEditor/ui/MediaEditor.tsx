// features/admin/mediaEditor/ui/MediaEditor.tsx

import { useEffect } from 'react';
import { useMediaEditorSession } from '../mediaEditorSession/MediaEditorSession.context';
import { MediaEditForm } from './MediaEditForm';
import { MediaFilterBar } from './MediaFilterBar';
import { MediaSelectGrid } from './MediaSelectGrid';
import './MediaEditor.css';

function MediaSelectMode() {
  const {
    filteredItems,
    allTags,
    filter,
    updateFilter,
    isLoading,
    selectItem,
    onAdd,
    isJourney,
    cancelPick,
  } = useMediaEditorSession();

  if (isLoading) {
    return <div className="media-editor__loading">Loading media items...</div>;
  }

  return (
    <>
      <div className="media-editor__sticky-header">
        <div className="media-editor__header">
          <h1 className="media-editor__title">
            {isJourney ? 'Pick a media item' : 'Media Library'}
          </h1>
          <div className="media-editor__pick-actions">
            <button type="button" className="media-editor__add-btn" onClick={onAdd}>
              Upload New
            </button>
            {/* Defensive Cancel path: the journey may be active even when the
                bootstrap landed in 'select' (e.g., direct nav during an open
                journey). Without this the user is dead-ended with no explicit
                way back to the caller. */}
            {isJourney && (
              <button
                type="button"
                className="media-edit-form__back"
                onClick={cancelPick}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
        <MediaFilterBar filter={filter} allTags={allTags} updateFilter={updateFilter} />
      </div>
      <MediaSelectGrid items={filteredItems} onSelect={selectItem} />
    </>
  );
}

function MediaPickMode() {
  const { filteredItems, allTags, filter, updateFilter, isLoading, selectItem, onAdd, cancelPick } =
    useMediaEditorSession();

  if (isLoading) {
    return <div className="media-editor__loading">Loading media items...</div>;
  }

  return (
    <>
      <div className="media-editor__sticky-header">
        <div className="media-editor__header">
          <h1 className="media-editor__title">Pick a media item</h1>
          <div className="media-editor__pick-actions">
            <button type="button" className="media-editor__add-btn" onClick={onAdd}>
              Upload New
            </button>
            <button type="button" className="media-edit-form__back" onClick={cancelPick}>
              Cancel
            </button>
          </div>
        </div>
        <MediaFilterBar filter={filter} allTags={allTags} updateFilter={updateFilter} />
      </div>
      <MediaSelectGrid items={filteredItems} onSelect={selectItem} />
    </>
  );
}

export function MediaEditor() {
  const { screenMode, isJourney, cancelPick } = useMediaEditorSession();

  // Escape returns to the caller any time a journey is in flight — lifted
  // to the container level so every child screen inherits it (pick, select,
  // edit, create). Previously Escape was only wired inside MediaPickMode,
  // which left the admin dead-ended if the bootstrap happened to land in
  // any other screen while a journey was active.
  useEffect(() => {
    if (!isJourney) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelPick();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isJourney, cancelPick]);

  return (
    <div className="media-editor">
      {screenMode === 'pick' ? (
        <MediaPickMode />
      ) : screenMode === 'select' ? (
        <MediaSelectMode />
      ) : (
        <MediaEditForm />
      )}
    </div>
  );
}
