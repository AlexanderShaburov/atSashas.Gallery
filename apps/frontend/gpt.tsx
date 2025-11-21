// src/features/admin/ui/HopperGrid/HopperGrid.tsx

import { GridItem } from '@/entities/grid';
import { useEffect, useState } from 'react';
import './HopperGrid.css';

interface HopperGridProps {
    hopper: GridItem[];
    // When selection changes: selected item or undefined if cleared
    setIdentity: (item: GridItem | undefined) => void;
}

export default function HopperGrid({ hopper, setIdentity }: HopperGridProps) {
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

    // Handle click on tile: toggle selection
    function handleClick(item: GridItem): void {
        setSelectedId((prev) => {
            const next = prev === item.id ? undefined : item.id;

            if (next === undefined) {
                // Deselected
                setIdentity(undefined);
            } else {
                // Selected new item
                setIdentity(item);
            }

            return next;
        });
    }

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
