// src/features/public/ui/GalleryStream/GalleryStream.tsx

import { useEffect, useState } from 'react';

import type { Block } from '@/entities/block';
import type { StreamData } from '@/entities/stream';
import { loadMediaItemsOnce } from '@/features/public/api/mediaItemsModule';
import { getBlockCollection, getPublicBlocks } from '@/features/public/api/publicBlocksApi';
import { loadTextVisualsOnce } from '@/features/public/api/textVisualsModule';
import GalleryBlock from '@/features/public/ui/GalleryBlock/GalleryBlock';

type GalleryStreamProps = {
    stream: StreamData;
    mode?: 'public' | 'preview';
};

export function GalleryStream({ stream, mode = 'public' }: GalleryStreamProps) {
    const [collection, setCollection] = useState<Record<string, Block> | undefined>(undefined);

    useEffect(() => {
        (async () => {
            try {
                const [blocksResult] = await Promise.all([
                    mode === 'preview'
                        ? getBlockCollection()
                        : getPublicBlocks(stream.streamId),
                    loadTextVisualsOnce(),
                    loadMediaItemsOnce(),
                ]);
                if (mode === 'preview') {
                    const collection = blocksResult as Awaited<ReturnType<typeof getBlockCollection>>;
                    if (!collection) throw new Error('Collection download failed.');
                    setCollection(collection.blocks);
                } else {
                    setCollection(blocksResult as Record<string, Block>);
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
