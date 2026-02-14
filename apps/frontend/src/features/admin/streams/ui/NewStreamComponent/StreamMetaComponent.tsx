import { StreamMetadata } from '@/entities/stream';
import { generateId } from '@/shared/lib/id/generateId';
import { useEffect, useMemo, useState } from 'react';
import './StreamMetaComponent.css';

type Props = {
    initial?: StreamMetadata;

    onCancel: () => void;
    onSubmit: (draft: StreamMetadata) => Promise<void>;

    isLoading?: boolean;
    error?: string | null;

    headerText?: string;
    submitText?: string;

    // NEW: Thumbnail selection
    currentThumbnail?: string;
    onSelectThumbnail?: () => void;
};

export function StreamMetaComponent(props: Props) {
    const [streamId, setStreamId] = useState<string | undefined>(undefined);
    const [title, setTitle] = useState('');
    const [tagsText, setTagsText] = useState('');
    const [description, setDescription] = useState('');

    // hydrate when initial changes (important if loaded async)
    useEffect(() => {
        if (!props.initial) return;
        setStreamId(props.initial.streamId);
        setTitle(props.initial.title ?? '');
        setTagsText((props.initial.tags ?? []).join(', '));
        setDescription(props.initial.description ?? '');
    }, [props.initial]);

    const tags = useMemo(() => normalizeTags(tagsText), [tagsText]);

    const validation = useMemo(() => {
        const problems: string[] = [];
        const t = title.trim();
        if (!t) problems.push('title is required');
        if (description.length > 2000) problems.push('description is too long');
        return { ok: problems.length === 0, problems };
    }, [title, description]);

    const canSubmit = validation.ok && !props.isLoading;

    return (
        <div className="csc">
            <div className="csc__header">
                <h1 className="csc__title">{props.headerText ?? 'Stream metadata'}</h1>
                <div className="csc__actions">
                    <button onClick={props.onCancel} disabled={props.isLoading}>
                        Cancel
                    </button>

                    <button
                        onClick={() =>
                            props.onSubmit({
                                streamId: streamId ? streamId : generateId('stream'),
                                title: title.trim(),
                                tags,
                                description: description.trim() ? description.trim() : '',
                                thumbnail: props.currentThumbnail,
                            })
                        }
                        disabled={!canSubmit}
                    >
                        {props.isLoading ? 'Saving…' : (props.submitText ?? 'Save')}
                    </button>
                </div>
            </div>

            <div className="csc__form">
                <label className="csc__field">
                    <div className="csc__label">title</div>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="My stream"
                        disabled={props.isLoading}
                    />
                </label>

                <label className="csc__field">
                    <div className="csc__label">tags</div>
                    <input
                        value={tagsText}
                        onChange={(e) => setTagsText(e.target.value)}
                        placeholder="comma, separated, tags"
                        disabled={props.isLoading}
                    />
                    {tags.length > 0 && (
                        <div className="csc__chips">
                            {tags.map((t) => (
                                <span key={t} className="csc__chip">
                                    {t}
                                </span>
                            ))}
                        </div>
                    )}
                </label>

                <label className="csc__field">
                    <div className="csc__label">description</div>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional..."
                        rows={4}
                        disabled={props.isLoading}
                    />
                </label>

                {props.onSelectThumbnail && (
                    <label className="csc__field">
                        <div className="csc__label">
                            stream thumbnail
                            <span className="csc__required">* required for publishing</span>
                        </div>
                        {props.currentThumbnail ? (
                            <div className="csc__thumbnailPreview">
                                <img
                                    src={props.currentThumbnail}
                                    alt="Stream thumbnail"
                                    className="csc__thumbnailImg"
                                />
                                <button
                                    type="button"
                                    onClick={props.onSelectThumbnail}
                                    disabled={props.isLoading}
                                    className="csc__thumbnailChange"
                                >
                                    Change thumbnail
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={props.onSelectThumbnail}
                                disabled={props.isLoading}
                                className="csc__thumbnailSelect"
                            >
                                Select thumbnail from catalog
                            </button>
                        )}
                    </label>
                )}

                {!validation.ok && (
                    <div className="csc__validation">
                        <div className="csc__validationTitle">Fix these issues:</div>
                        <ul>
                            {validation.problems.map((p) => (
                                <li key={p}>{p}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {props.error && <div className="csc__error">{props.error}</div>}
            </div>
        </div>
    );
}

function normalizeTags(input: string): string[] {
    const raw = input
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

    const seen = new Set<string>();
    const uniq: string[] = [];
    for (const t of raw) {
        const key = t.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        uniq.push(t);
    }
    return uniq;
}
