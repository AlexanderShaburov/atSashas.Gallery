import { GridItem } from '@/entities/grid';
import { useEffect, useState } from 'react';
import './HopperGrid.css';

interface HopperGridProps {
    hopper: GridItem[];
    setIdentity: (item: GridItem | undefined) => void;
}

export default function HopperGrid({ hopper, setIdentity }: HopperGridProps) {
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

    // Handle click on tile: toggle selection
    function handleClick(item: GridItem): void {
        setSelectedId((prev) => (prev === item.id ? undefined : item.id));
    }

    // Sync selectedId -> identity (inform parent) AFTER render
    useEffect(() => {
        if (!selectedId) {
            setIdentity(undefined);
            return;
        }

        const item = hopper.find((i) => i.id === selectedId);
        setIdentity(item);
    }, [selectedId, hopper, setIdentity]);

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

    if (!hopper.length) {
        return <div className="hopper-grid hopper-grid--empty">No items yet</div>;
    }

    return (
        <div className="hopper-grid">
            {hopper.map((item) => (
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
