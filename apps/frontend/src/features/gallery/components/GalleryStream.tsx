import type { Block } from '@/entities/block';
import type { StreamData } from '@/entities/stream';
import GalleryBlock from './GalleryBlock';

export function GalleryStream(stream: StreamData) {
    return (
        <section className="container gallery-page">
            <header className="page-header">
                <h1>{stream.title}</h1>
            </header>

            <div className="gallery-stream">
                {stream.blocks.map((b: Block) => (
                    <GalleryBlock key={b.id} block={b} />
                ))}
            </div>
        </section>
    );
}
