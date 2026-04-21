import '@/pages/public/Home.css';
import { useHomeFeed } from '@/features/public/hooks/useHomeFeed';
import { HomeEventTile } from '@/features/public/ui/HomeEventTile/HomeEventTile';
import { Link } from 'react-router-dom';

export default function HomePage({ mode = 'public' }: { mode?: 'public' | 'preview' }) {
    const { homeDoc, streams, events, loading, error, isPreview } = useHomeFeed(mode);

    if (loading) {
        return (
            <section className="home">
                <div className="infoContainer">Loading gallery...</div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="home">
                <div className="infoContainer">Error: {error}</div>
            </section>
        );
    }

    if (!homeDoc || homeDoc.items.length === 0) {
        return (
            <section className="home">
                <div className="infoContainer">No content yet.</div>
            </section>
        );
    }

    const linkPrefix = isPreview ? '/preview' : '/gallery';

    return (
        <section className="home">
            {isPreview && (
                <div className="preview-banner">Draft Preview — changes are not live</div>
            )}
            <div className="tiles">
                {homeDoc.items.map((item, index) => {
                    if (item.kind === 'streamRef') {
                        const stream = streams.get(item.streamId);
                        if (!stream) return null;

                        const posx = 50 + (index % 2) * 10 - 5;
                        const posy = 50 + Math.floor(index / 2) * 5;
                        const zoom = 1.2 + (index % 3) * 0.1;

                        return (
                            <nav key={`stream-${item.streamId}`} className="home-nav">
                                <Link
                                    to={`${linkPrefix}/${stream.streamId}`}
                                    className="tile"
                                    aria-label={stream.title}
                                    style={
                                        {
                                            '--pos-x': `${posx}%`,
                                            '--pos-y': `${posy}%`,
                                            '--zoom': zoom,
                                        } as React.CSSProperties
                                    }
                                >
                                    {(item.thumbOverrideUrl ?? stream.thumbnail) ? (
                                        <img
                                            src={item.thumbOverrideUrl ?? stream.thumbnail}
                                            alt={stream.title}
                                            className="tile-img"
                                        />
                                    ) : (
                                        <div
                                            className="tile-img tile-img--placeholder"
                                            aria-hidden="true"
                                        >
                                            <span>{stream.title.charAt(0)}</span>
                                        </div>
                                    )}
                                    <span className="tile-label">{stream.title}</span>
                                </Link>
                            </nav>
                        );
                    }

                    if (item.kind === 'eventRef') {
                        const page = events.get(item.eventPageId);
                        if (!page) return null;
                        return (
                            <HomeEventTile
                                key={`event-${item.eventPageId}`}
                                page={page}
                                mode={isPreview ? 'preview' : 'public'}
                            />
                        );
                    }

                    return null;
                })}
            </div>
        </section>
    );
}
