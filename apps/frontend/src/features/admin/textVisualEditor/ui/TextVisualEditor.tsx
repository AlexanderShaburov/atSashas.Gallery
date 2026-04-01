// features/admin/textVisualEditor/ui/TextVisualEditor.tsx

import type { TextVisualDraft } from '../textVisualEditorSession/TextVisualEditorSession.context';
import { useTextVisualEditorSession } from '../textVisualEditorSession/TextVisualEditorSession.context';
import './TextVisualEditor.css';

function cardBackground(draft: {
  backgroundKind: string;
  backgroundColor: string;
  backgroundGradient: string;
  backgroundImageUrl: string;
}): React.CSSProperties {
  switch (draft.backgroundKind) {
    case 'image':
      return {
        backgroundImage: draft.backgroundImageUrl ? `url(${draft.backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#f3f4f6',
      };
    case 'gradient':
      return { background: draft.backgroundGradient || '#f3f4f6' };
    case 'color':
    default:
      return { backgroundColor: draft.backgroundColor || '#f3f4f6' };
  }
}

function TextVisualList() {
  const { textVisuals, isLoading, selectItem, createNew } = useTextVisualEditorSession();

  if (isLoading) {
    return <div className="tve__loading">Loading text visuals...</div>;
  }

  return (
    <>
      <div className="tve__header">
        <h1 className="tve__title">Text Visuals</h1>
        <div className="tve__actions">
          <button className="tve__btn tve__btn--primary" onClick={createNew}>
            New Text Visual
          </button>
        </div>
      </div>

      {textVisuals.length === 0 ? (
        <div className="tve__empty">No text visuals yet. Create one to get started.</div>
      ) : (
        <div className="tve__grid">
          {textVisuals.map((tv) => {
            const bg = cardBackground({
              backgroundKind: tv.background.kind,
              backgroundColor: tv.background.kind === 'color' ? tv.background.color : '#f3f4f6',
              backgroundGradient:
                tv.background.kind === 'gradient' ? tv.background.gradient : '',
              backgroundImageUrl:
                tv.background.kind === 'image' ? tv.background.imageUrl : '',
            });
            return (
              <div key={tv.id} className="tve__card" onClick={() => selectItem(tv.id)}>
                <div className="tve__card-bg" style={bg} />
                <div
                  className="tve__card-text"
                  style={{ color: tv.typography.color }}
                >
                  {tv.title?.en || 'Untitled'}
                </div>
                <div className="tve__card-id">{tv.id}</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

const BG_KINDS: Array<{ value: TextVisualDraft['backgroundKind']; label: string }> = [
  { value: 'color', label: 'Color' },
  { value: 'image', label: 'Image' },
  { value: 'gradient', label: 'Gradient' },
];

const ALIGN_OPTIONS: Array<{ value: TextVisualDraft['textAlign']; label: string }> = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

function TextVisualForm() {
  const { draft, isSaving, screenMode, setDraftField, save, deleteItem, back } =
    useTextVisualEditorSession();

  const isEdit = screenMode === 'edit';
  const heading = isEdit ? 'Edit Text Visual' : 'New Text Visual';

  return (
    <>
      <div className="tve__header">
        <h1 className="tve__title">{heading}</h1>
      </div>

      <div className="tve__form">
        {/* ── Background ── */}
        <h3 className="tve__section-title">Background</h3>

        <div className="tve__field">
          <label>Kind</label>
          <div className="tve__radio-group">
            {BG_KINDS.map((opt) => (
              <label key={opt.value}>
                <input
                  type="radio"
                  name="backgroundKind"
                  value={opt.value}
                  checked={draft.backgroundKind === opt.value}
                  onChange={() => setDraftField('backgroundKind', opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {draft.backgroundKind === 'image' && (
          <div className="tve__field">
            <label>Image URL</label>
            <input
              type="text"
              value={draft.backgroundImageUrl}
              onChange={(e) => setDraftField('backgroundImageUrl', e.target.value)}
              placeholder="/media/images/..."
            />
          </div>
        )}
        {draft.backgroundKind === 'color' && (
          <div className="tve__row">
            <div className="tve__field">
              <label>Color</label>
              <input
                type="color"
                value={draft.backgroundColor}
                onChange={(e) => setDraftField('backgroundColor', e.target.value)}
              />
            </div>
            <div className="tve__field">
              <label>Hex</label>
              <input
                type="text"
                value={draft.backgroundColor}
                onChange={(e) => setDraftField('backgroundColor', e.target.value)}
                placeholder="#ffffff"
              />
            </div>
          </div>
        )}
        {draft.backgroundKind === 'gradient' && (
          <div className="tve__field">
            <label>CSS Gradient</label>
            <input
              type="text"
              value={draft.backgroundGradient}
              onChange={(e) => setDraftField('backgroundGradient', e.target.value)}
              placeholder="linear-gradient(135deg, #667eea, #764ba2)"
            />
          </div>
        )}

        {/* ── Text Content ── */}
        <h3 className="tve__section-title">Text Content</h3>

        <div className="tve__field">
          <label>Title (EN)</label>
          <input
            type="text"
            value={draft.titleEn}
            onChange={(e) => setDraftField('titleEn', e.target.value)}
            placeholder="Title text"
          />
        </div>

        <div className="tve__field">
          <label>Subtitle (EN)</label>
          <input
            type="text"
            value={draft.subtitleEn}
            onChange={(e) => setDraftField('subtitleEn', e.target.value)}
            placeholder="Subtitle text"
          />
        </div>

        <div className="tve__field">
          <label>Body (EN)</label>
          <textarea
            value={draft.bodyEn}
            onChange={(e) => setDraftField('bodyEn', e.target.value)}
            placeholder="Body text"
          />
        </div>

        <div className="tve__field">
          <label>Caption (EN)</label>
          <input
            type="text"
            value={draft.captionEn}
            onChange={(e) => setDraftField('captionEn', e.target.value)}
            placeholder="Caption text"
          />
        </div>

        {/* ── Typography ── */}
        <h3 className="tve__section-title">Typography</h3>

        <div className="tve__row">
          <div className="tve__field">
            <label>Font Family</label>
            <input
              type="text"
              value={draft.fontFamily}
              onChange={(e) => setDraftField('fontFamily', e.target.value)}
              placeholder="Inter"
            />
          </div>
          <div className="tve__field">
            <label>Font Size (px)</label>
            <input
              type="number"
              min={8}
              max={200}
              value={draft.fontSize}
              onChange={(e) => setDraftField('fontSize', e.target.value)}
            />
          </div>
        </div>

        <div className="tve__row">
          <div className="tve__field">
            <label>Font Weight</label>
            <input
              type="number"
              min={100}
              max={900}
              step={100}
              value={draft.fontWeight}
              onChange={(e) => setDraftField('fontWeight', e.target.value)}
            />
          </div>
          <div className="tve__field">
            <label>Line Height</label>
            <input
              type="number"
              min={0.5}
              max={4}
              step={0.1}
              value={draft.lineHeight}
              onChange={(e) => setDraftField('lineHeight', e.target.value)}
            />
          </div>
        </div>

        <div className="tve__row">
          <div className="tve__field">
            <label>Text Align</label>
            <select
              value={draft.textAlign}
              onChange={(e) =>
                setDraftField('textAlign', e.target.value as TextVisualDraft['textAlign'])
              }
            >
              {ALIGN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="tve__field">
            <label>Text Color</label>
            <input
              type="color"
              value={draft.textColor}
              onChange={(e) => setDraftField('textColor', e.target.value)}
            />
          </div>
        </div>

        {/* ── Text Box Layout ── */}
        <h3 className="tve__section-title">Text Box Layout (%)</h3>

        <div className="tve__row">
          <div className="tve__field">
            <label>X (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.textBoxX}
              onChange={(e) => setDraftField('textBoxX', e.target.value)}
            />
          </div>
          <div className="tve__field">
            <label>Y (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.textBoxY}
              onChange={(e) => setDraftField('textBoxY', e.target.value)}
            />
          </div>
        </div>

        <div className="tve__row">
          <div className="tve__field">
            <label>Width (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.textBoxWidth}
              onChange={(e) => setDraftField('textBoxWidth', e.target.value)}
            />
          </div>
          <div className="tve__field">
            <label>Height (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.textBoxHeight}
              onChange={(e) => setDraftField('textBoxHeight', e.target.value)}
            />
          </div>
        </div>

        <div className="tve__field">
          <label>Padding (px)</label>
          <input
            type="number"
            min={0}
            value={draft.textBoxPadding}
            onChange={(e) => setDraftField('textBoxPadding', e.target.value)}
          />
        </div>

        {/* ── Overlay ── */}
        <h3 className="tve__section-title">Overlay</h3>

        <label className="tve__checkbox-label">
          <input
            type="checkbox"
            checked={draft.overlayEnabled}
            onChange={(e) => setDraftField('overlayEnabled', e.target.checked)}
          />
          Enable Overlay
        </label>

        {draft.overlayEnabled && (
          <>
            <div className="tve__row">
              <div className="tve__field">
                <label>Color</label>
                <input
                  type="color"
                  value={draft.overlayColor}
                  onChange={(e) => setDraftField('overlayColor', e.target.value)}
                />
              </div>
              <div className="tve__field">
                <label>Opacity (0-1)</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={draft.overlayOpacity}
                  onChange={(e) => setDraftField('overlayOpacity', e.target.value)}
                />
              </div>
              <div className="tve__field">
                <label>Blur (px)</label>
                <input
                  type="number"
                  min={0}
                  value={draft.overlayBlur}
                  onChange={(e) => setDraftField('overlayBlur', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Toolbar ── */}
        <div className="tve__toolbar">
          <button className="tve__btn tve__btn--secondary" onClick={back}>
            Back
          </button>
          <button
            className="tve__btn tve__btn--primary"
            onClick={() => void save()}
            disabled={isSaving || !draft.titleEn}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {isEdit && draft.id && (
            <button
              className="tve__btn tve__btn--danger"
              onClick={() => void deleteItem(draft.id!)}
              disabled={isSaving}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export function TextVisualEditor() {
  const { screenMode } = useTextVisualEditorSession();

  return (
    <div className="tve">
      {screenMode === 'list' ? <TextVisualList /> : <TextVisualForm />}
    </div>
  );
}
