// features/admin/mediaEditor/ui/MediaEditor.tsx

import { useEffect } from 'react';
import { useMediaEditorSession } from '../mediaEditorSession/MediaEditorSession.context';
import { MediaEditForm } from './MediaEditForm';
import { MediaFilterBar } from './MediaFilterBar';
import { MediaSelectGrid } from './MediaSelectGrid';
import './MediaEditor.css';

function MediaSelectMode() {
  const { filteredItems, allTags, filter, updateFilter, isLoading, selectItem, onAdd } =
    useMediaEditorSession();

  if (isLoading) {
    return <div className="media-editor__loading">Loading media items...</div>;
  }

  return (
    <>
      <div className="media-editor__header">
        <h1 className="media-editor__title">Media Library</h1>
        <button type="button" className="media-editor__add-btn" onClick={onAdd}>
          Upload New
        </button>
      </div>
      <MediaFilterBar filter={filter} allTags={allTags} updateFilter={updateFilter} />
      <MediaSelectGrid items={filteredItems} onSelect={selectItem} />
    </>
  );
}

function MediaPickMode() {
  const { filteredItems, allTags, filter, updateFilter, isLoading, selectItem, onAdd, cancelPick } =
    useMediaEditorSession();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelPick();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cancelPick]);

  if (isLoading) {
    return <div className="media-editor__loading">Loading media items...</div>;
  }

  return (
    <>
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
      <MediaSelectGrid items={filteredItems} onSelect={selectItem} />
    </>
  );
}

export function MediaEditor() {
  const { screenMode } = useMediaEditorSession();

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
