// EditorLayout.tsx
import './catalog-editor.css';
type Thumb = { id: string; srs: string; alt?: string };

interface Props {
    thumbs: Thumb[];
    selectedId: string | null;
    setSelectedId: (id: string) => void;
    form: React.ReactNode;
}

export default function CatalogEditorLayout({ thumbs, selectedId, setSelectedId, form }: Props) {
    const selected = thumbs.find((t) => t.id === selectedId) || null;

    return (
        <div className="ce-layout">
            <aside className="ce-previews" aria-label="Artwork previews">
                {/* Mobile: horizontal scroller */}
                {/* GIVES US THUMBNAIL PREVIEW SET */}
                <div className="ce-=thumbs-strip">
                    {thumbs.map((t) => (
                        <ThumbCard
                            key={t.id}
                            t={t}
                            selected={t.id === selectedId}
                            onClick={() => setSelectedId(t.id)}
                            mobile
                        />
                    ))}
                </div>

                {/* Desktop: featured + grid */}
                {selected && (
                    <div className="ce-featured">
                        <ThumbCard
                            t={selected}
                            selected
                            onClick={() => {}}
                            ariaLabel="Selected artwork"
                        />
                    </div>
                )}
                {/* GIVES US THUMBNAIL PREVIEW SET */}
                <div className="ce-thumbs-grid">
                    {thumbs.map((t) => (
                        <ThumbCard
                            key={t.id}
                            t={t}
                            selected={t.id === selectedId}
                            onClick={() => setSelectedId(t.id)}
                        />
                    ))}
                </div>
            </aside>

            <section className="ce-form-col" aria-label="Metadata form">
                <div className="ce-form-wrap">{form}</div>
            </section>
        </div>
    );
}

function ThumbCard({
    t,
    selected,
    onClick,
    mobile = false,
    ariaLabel,
}: {
    t: Thumb;
    selected: boolean;
    onClick: () => void;
    mobile?: boolean;
    ariaLabel?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'ce-thumb',
                mobile ? 'is-mobile' : '',
                selected ? 'is-selected' : 'is-dimmed',
            ].join(' ')}
            aria-pressed={selected}
            aria-label={ariaLabel || t.alt || 'thumbnail'}
        >
            <img src={t.srs} alt={t.alt || ''} className="ce-thumb-img" loading="lazy" />
            {selected && <span className="ce-badge">Selected</span>}
        </button>
    );
}
