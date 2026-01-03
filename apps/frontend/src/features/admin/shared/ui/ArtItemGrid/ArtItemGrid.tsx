// src/features/admin/shared/ui/ArtItemGrid/ArtItemGrid.tsx

import { GridItem } from '@/entities/grid';
import { useEffect, useState } from 'react';
import './ArtItemGrid.css';

interface ArtItemGridProps {
    artCollection: GridItem[];
    setIdentity: (item: GridItem | undefined) => void;
}

export default function ArtItemGrid({ artCollection, setIdentity }: ArtItemGridProps) {
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

    // Handle click on tile: toggle selection
    function handleClick(item: GridItem): void {
        setSelectedId((prev) => (prev === item.id ? undefined : item.id));
        console.log(`Current artCollection is: ${artCollection}`);
        console.dir(artCollection);
    }

    // Sync selectedId -> identity (inform parent) AFTER render
    useEffect(() => {
        if (!selectedId) {
            // setIdentity(undefined);
            return;
        }

        const item = artCollection.find((i) => i.id === selectedId);
        setIdentity(item);
    }, [selectedId, artCollection, setIdentity]);

    // Handle Escape: clear selection
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setSelectedId(undefined);
                setIdentity(undefined);
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIdentity]);

    if (!artCollection || !artCollection.length) {
        return <div className="hopper-grid hopper-grid--empty">No items yet</div>;
    }

    return (
        <div className="hopper-grid">
            {artCollection.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    className={`hopper-grid-item ${item.id === selectedId ? 'is-selected' : ''}`}
                    onClick={() => handleClick(item)}
                >
                    <img src={item.thumbUrl} alt={item.title ?? ''} loading="lazy" />
                </button>
            ))}
        </div>
    );
}
