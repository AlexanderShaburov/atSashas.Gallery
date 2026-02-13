// src/features/public/ui/GalleryStream/GalleryStream.tsx

import type { Block } from '@/entities/block';
import type { StreamData } from '@/entities/stream';
import GalleryBlock from '@/features/public/ui/GalleryBlock/GalleryBlock';
// Temp decision:
import { getCollection } from '@/features/admin/blocks/api/blocksApi';
import { useEffect, useState } from 'react';

export function GalleryStream(stream: StreamData) {
    const [collection, setCollection] = useState<Record<string, Block> | undefined>(undefined);

    useEffect(() => {
        (async () => {
            try {
                console.log('[GalleryStream] Loading blocks collection...');
                const call = await getCollection();
                if (!call) throw new Error(`Collection download failed.`);
                console.log('[GalleryStream] Blocks loaded, setting collection. Block count:', Object.keys(call.blocks).length);
                setCollection(call.blocks);
            } catch (err) {
                console.error('[GalleryStream] Failed to load blocks:', err);
            }
        })();
    }, []);

    console.log('[GalleryStream] Render - stream:', stream);
    console.log('[GalleryStream] Stream blockIds:', stream.blockIds);
    console.log('[GalleryStream] Collection loaded:', !!collection);

    if (!collection) return <div>Loading...</div>;

    console.log('[GalleryStream] Rendering blocks. Stream has', stream.blockIds.length, 'blockIds');

    return (
        <section className="container gallery-page">
            <header className="page-header">
                <h1>{stream.title}</h1>
            </header>

            <div className="gallery-stream">
                {stream.blockIds.map((id: string) => {
                    const b = collection[id];
                    console.log('[GalleryStream] Block', id, 'found:', !!b);
                    if (b) return <GalleryBlock key={id} block={b} />;
                    return null;
                })}
            </div>
        </section>
    );
}
