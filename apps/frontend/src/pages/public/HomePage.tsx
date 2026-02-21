import '@/pages/public/Home.css';
import { usePublicStream } from '@/features/public/hooks/usePublicStream';
import { Link } from 'react-router-dom';

export default function HomePage({ mode = 'public' }: { mode?: 'public' | 'preview' }) {
    const { streams, loading, error, isPreview } = usePublicStream(mode);

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

    if (streams.length === 0) {
        return (
            <section className="home">
                <div className="infoContainer">No published streams yet.</div>
            </section>
        );
    }

    const linkPrefix = isPreview ? '/preview' : '/gallery';

    return (
        <section className="home">
            {isPreview && (
                <div className="preview-banner">
                    Draft Preview — changes are not live
                </div>
            )}
            <div className="tiles">
                {streams.map((stream, index) => {
                    // Calculate position with slight offset for visual variety
                    const posx = 50 + (index % 2) * 10 - 5;
                    const posy = 50 + Math.floor(index / 2) * 5;
                    const zoom = 1.2 + (index % 3) * 0.1;

                    return (
                        <nav key={stream.streamId} className="home-nav">
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
                                {stream.thumbnail ? (
                                    <img
                                        src={stream.thumbnail}
                                        alt={stream.title}
                                        className="tile-img"
                                    />
                                ) : (
                                    <div className="tile-img tile-img--placeholder" aria-hidden="true">
                                        <span>{stream.title.charAt(0)}</span>
                                    </div>
                                )}
                                <span className="tile-label">{stream.title}</span>
                            </Link>
                        </nav>
                    );
                })}
            </div>
        </section>
    );
}
