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
            const call = await getCollection();
            if (!call) throw new Error(`Collection download failed.`);
            setCollection(call.blocks);
        })();
    }, []);
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
                })}
            </div>
        </section>
    );
}
