import { useEffect, useRef, useState } from 'react';

import type { GalleryBlock } from '@/entities/block';
import { useResolveArtAdaptive } from '@/shared/ArtCatalogProvider/useResolveArtAdaptive';
import { GalleryBlockView } from '@/shared/ui/GalleryBlockView';

import './BlockThumbnail.css';

const REFERENCE_WIDTH = 720;

type Props = {
    block: GalleryBlock;
};

export function BlockThumbnail({ block }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0);
    const resolveArt = useResolveArtAdaptive();

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const width = entry.contentRect.width;
            setScale(width / REFERENCE_WIDTH);
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="block-thumb" ref={containerRef}>
            {scale > 0 && (
                <div
                    className="block-thumb__inner"
                    style={{
                        transform: `scale(${scale}) translate(-50%, -50%)`,
                    }}
                >
                    <GalleryBlockView block={block} resolveArt={resolveArt} />
                </div>
            )}
        </div>
    );
}
