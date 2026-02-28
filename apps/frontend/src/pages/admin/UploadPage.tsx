// src/pages/admin/UploadPage.tsx

import { GridItem } from '@/shared/ui/grid';
import {
    deleteFromHopper,
    getHopperContent,
    uploadImage,
} from '@/features/admin/catalogEditor/api';
import {
    useArrival,
    useJourneyStatus,
    useReturnHome,
} from '@/features/admin/shared/transporter/transporter';
import ArtItemGrid from '@/features/admin/shared/ui/ArtItemGrid/ArtItemGrid';
import '@/pages/admin/Upload.css';
import { generateId } from '@/shared/lib/id/generateId';
import { JumpResult } from '@/shared/nav';
import { ToolbarCtx, ToolKey } from '@/shared/ui/SingleEditorToolbar/single-editor-toolbar.types';
import { SingleEditorToolbar } from '@/shared/ui/SingleEditorToolbar/SingleEditorToolbar';
import { useEffect, useRef, useState, type DragEvent } from 'react';

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState<GridItem[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const arrival = useArrival();
    const returnHome = useReturnHome();

    // NEW: Derived journey state (replaces local useState)
    const isJourney = useJourneyStatus('hopper');

    // React Strict Mode protection for bootstrap
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bootstrapRef = useRef<{ processed: boolean; ticket: any }>({
        processed: false,
        ticket: null,
    });

    // Handle grid selection ( deselect: undefined)
    const handleSelect = (item: GridItem | undefined) => {
        if (!item) {
            setSelectedId(null);
            return;
        }
        setSelectedId(item.id);
    };
    // ************** BOOTSTRAP MOUNT ***************
    useEffect(() => {
        console.log('[Hopper BOOTSTRAP]: Effect started');

        // React Strict Mode protection: Only process once
        if (bootstrapRef.current.processed) {
            console.log('[Hopper BOOTSTRAP]: Skipping - already processed');
            return;
        }

        // CRITICAL: Call arrival() synchronously FIRST, before any async operations
        // This prevents race conditions in React Strict Mode
        const ticket = arrival('hopper');
        console.log('[Hopper BOOTSTRAP]: ticket received:', ticket);

        // Mark as processed and store ticket
        bootstrapRef.current = { processed: true, ticket };

        // Process ticket if present
        if (ticket) {
            if (ticket.phase === 'outbound' && ticket.destination.mode === 'select') {
                console.log('[Hopper BOOTSTRAP]: Outbound select ticket - ready for selection');
                // isJourney now derived from useJourneyStatus() - UI will show Apply button
            } else {
                console.warn('[Hopper BOOTSTRAP]: Unexpected ticket configuration:', ticket);
            }
        }

        // Now perform async operations
        (async () => {
            // Download hopper content once at page load
            const artItemGrid = await getHopperContent();
            console.log(`[UploadPage]: artItemGrid (Hopper) is: `);
            console.dir(artItemGrid);
            setUploaded(artItemGrid);
        })();
    }, [arrival]);

    // ************* HANDLERS SECTION *************

    async function handleUpload() {
        if (!files.length) return;
        setUploading(true);
        try {
            const newGrid: GridItem[] = [];

            for (const file of files) {
                const { url, ok } = await uploadImage(file, 'hopper');
                if (ok && url) {
                    newGrid.push({ id: generateId('art'), thumbUrl: url });
                }
            }

            setUploaded((prev) => [...prev, ...newGrid]);
            setFiles([]);
        } finally {
            setUploading(false);
        }
    }

    // ------------- APPLY Handler ----------------
    const handleApply = () => {
        if (!isJourney) return;
        if (!selectedId) return;
        const image = uploaded.find((i) => i.id === selectedId);
        const loot: JumpResult = {
            ok: true,
            id: selectedId,
            output: image,
        };
        returnHome('hopper', loot);
    };
    // ------------- DELETE Handler ---------------
    // Remove on FE for now
    function handleDelete() {
        if (!selectedId) return;
        setUploaded((prev) => prev.filter((t) => t.id !== selectedId));
        console.log(`filename to be deleted: ${selectedId}`);
        deleteFromHopper(selectedId);
        setSelectedId(null);
    }

    // ---- Drag & drop handlers for drop zone ----

    function handleDragOver(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDragEnter(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }

    function handleDragLeave(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }

    function handleDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const dropped = Array.from(e.dataTransfer.files || []);
        if (!dropped.length) return;

        setFiles((prev) => [...prev, ...dropped]);
    }
    const tools: ToolKey[] = isJourney ? ['delete', 'apply'] : ['delete'];
    const ctx: ToolbarCtx = {
        canSave: true,
        isSaving: false,
        exit: () => {},
        onDelete: handleDelete,
        onApply: handleApply,
    };
    return (
        <div className="upload-page">
            <h1>Upload artworks</h1>

            <section
                className={`upload-drop ${isDragging ? 'upload-drop--drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="upload-input-overlay">
                    <input
                        className="upload-file-input"
                        type="file"
                        multiple
                        onChange={(e) =>
                            setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])
                        }
                    />
                </div>

                <p className="upload-drop-title">Drag & drop files here or click to choose</p>

                {files.length > 0 && (
                    <div className="upload-drop-files">
                        <p>Files ready to upload:</p>
                        <ul>
                            {files.map((file) => (
                                <li key={`${file.name}-${file.lastModified}`}>
                                    <span className="upload-drop-file-name">{file.name}</span>
                                    <span className="upload-drop-file-size">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            {files.length > 0 && (
                <div className="upload-actions">
                    <button onClick={handleUpload} disabled={uploading} className="btn">
                        {uploading ? 'Uploading...' : `Start upload (${files.length})`}
                    </button>
                </div>
            )}

            <section className="upload-list">
                <div className="upload-list-header">
                    <h2>Uploaded Files</h2>
                </div>

                <ArtItemGrid
                    artCollection={uploaded}
                    selectedItemId={undefined}
                    setItemSelected={handleSelect}
                />
                <SingleEditorToolbar tools={tools} ctx={ctx} />
            </section>
        </div>
    );
}
