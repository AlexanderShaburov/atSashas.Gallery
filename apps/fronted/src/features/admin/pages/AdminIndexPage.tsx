import { Link } from "react-router-dom";
import './adminIndex.css'

type Tile = {
    to: string;
    title: string;
    emoji: string;
    description: string;
}

const tiles: Tile[] = [
    {
        to: '/admin/upload',
        title: 'Upload',
        emoji: '📤',
        description: "Upload new artworks to server hopper.",
    },
    {
        to: '/admin/catalog',
        title: 'Catalog',
        emoji: '🗂️',
        description: 'Select, edit metadata, and import to catalog.',
    },
    {
        to: '/admin/blocks',
        title: 'Blocks',
        emoji: '🧩',
        description: 'Assemble visual blocks with drag & drop.',
    },
    {
        to: '/admin/streams',
        title: 'Streams',
        emoji: '📽',
        description: 'Compose a stream from saved blocks.',
    },
];

export default function AdminIndexPage() {
    return (
        <div className="admin-index" >
            <header className="admin-index__header">
                <h1>Admin Panel</h1>
                <p className="admin-index__subtitle">
                    Choose a step to continue your workflow.
                </p>
            </header>

            <section className="admin-index__grid" >
                {tiles.map((t) => (
                    <Link key={t.to} to={t.to} className="admin-index__tile">
                        <div className="admin-index_emoji" aria-hidden>
                            {t.emoji}
                        </div>
                        <div className="admin-index__text">
                            <h2>{t.title}</h2>
                            <p>{t.description}</p>
                        </div>
                    </Link>
                ))}
            </section>
        </div>
    )
}