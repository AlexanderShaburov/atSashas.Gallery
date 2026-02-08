// src/features/admin/shared/ui/ArtItemGrid/ArtItemGrid.tsx

import { GridItem } from '@/entities/grid';
import { useEffect } from 'react';
import './ArtItemGrid.css';

interface ArtItemGridProps {
    artCollection: GridItem[];
    selectedItemId: string | undefined;
    setItemSelected: (item: GridItem | undefined) => void;
}

export default function ArtItemGrid({
    artCollection,
    selectedItemId,
    setItemSelected,
}: ArtItemGridProps) {
    // Handle click on tile: toggle selection
    function handleClick(item: GridItem): void {
        setItemSelected(item);
        console.log(`Current artCollection is: ${artCollection}`);
        console.dir(artCollection);
    }

    // Handle Escape: clear selection
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setItemSelected(undefined);
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setItemSelected]);

    if (!artCollection || !artCollection.length) {
        return <div className="hopper-grid hopper-grid--empty">No items yet</div>;
    }

    return (
        <div className="hopper-grid">
            {artCollection.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    className={`hopper-grid-item ${item.id === selectedItemId ? 'is-selected' : ''}`}
                    onClick={() => handleClick(item)}
                >
                    <img src={item.thumbUrl} alt={item.title ?? ''} loading="lazy" />
                </button>
            ))}
        </div>
    );
}
