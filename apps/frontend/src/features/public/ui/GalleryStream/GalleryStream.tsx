import type { Block } from '@/entities/block';
import type { StreamData } from '@/entities/stream';
import GalleryBlock from '@/features/public/ui/GalleryBlock/GalleryBlock';

export function GalleryStream(stream: StreamData) {
    return (
        <section className="container gallery-page">
            <header className="page-header">
                <h1>{stream.title}</h1>
            </header>

            <div className="gallery-stream">
                {stream.blockIds.map((id: string) => (
                    <GalleryBlock key={id} block={b} />
                ))}
            </div>
        </section>
    );
}
