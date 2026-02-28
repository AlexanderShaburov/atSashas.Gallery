// src/features/public/ui/GalleryStream/GalleryStream.tsx

import type { Block } from '@/entities/block';
import type { StreamData } from '@/entities/stream';
import { getBlockCollection, getPublicBlocks } from '@/features/public/api/publicBlocksApi';
import GalleryBlock from '@/features/public/ui/GalleryBlock/GalleryBlock';
import { useEffect, useState } from 'react';

type GalleryStreamProps = {
    stream: StreamData;
    mode?: 'public' | 'preview';
};

export function GalleryStream({ stream, mode = 'public' }: GalleryStreamProps) {
    const [collection, setCollection] = useState<Record<string, Block> | undefined>(undefined);

    useEffect(() => {
        (async () => {
            try {
                if (mode === 'preview') {
                    const collection = await getBlockCollection();
                    if (!collection) throw new Error('Collection download failed.');
                    setCollection(collection.blocks);
                } else {
                    const blocks = await getPublicBlocks(stream.streamId);
                    setCollection(blocks);
                }
            } catch (err) {
                console.error('[GalleryStream] Failed to load blocks:', err);
            }
        })();
    }, [stream.streamId, mode]);

    if (!collection) return <div>Loading...</div>;

    return (
        <section className="container gallery-page">
            <header className="page-header">
                <h1>{stream.title}</h1>
            </header>

            <div className="gallery-stream">
                {stream.blockIds.map((id: string) => {
                    const b = collection[id];
                    if (b) return <GalleryBlock key={id} block={b} />;
                    return null;
                })}
            </div>
        </section>
    );
}
