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
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
    const [isDragging, setIsDragging] = useState(false);
    // Surface upload + hopper-load errors in the UI instead of letting
    // them escape as unhandled promise rejections (which is what the
    // console logs on the server showed).
    const [errorMessage, setErrorMessage] = useState<string>('');

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
            setSelectedId(undefined);
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

        // Now perform async operations. Errors are caught and surfaced
        // to the UI — previously they bubbled as unhandled promise
        // rejections ("The string did not match the expected pattern"
        // on server builds where VITE_API_BASE_URL was not substituted).
        void (async () => {
            try {
                const artItemGrid = await getHopperContent();
                console.log(`[UploadPage]: artItemGrid (Hopper) is: `);
                console.dir(artItemGrid);
                setUploaded(artItemGrid);
            } catch (err) {
                console.error('[UploadPage] Failed to load hopper content:', err);
                setErrorMessage(
                    err instanceof Error
                        ? `Could not load uploaded files: ${err.message}`
                        : 'Could not load uploaded files.',
                );
            }
        })();
    }, [arrival]);

    // ************* HANDLERS SECTION *************

    async function handleUpload() {
        if (!files.length) return;
        setUploading(true);
        setErrorMessage('');
        try {
            const newGrid: GridItem[] = [];
            const failed: string[] = [];

            for (const file of files) {
                try {
                    const result = await uploadImage(file, 'hopper');
                    const { url, ok } = result ?? {};
                    if (ok && url) {
                        newGrid.push({ id: generateId('art'), thumbUrl: url });
                    } else {
                        failed.push(file.name);
                    }
                } catch (err) {
                    console.error('[UploadPage] Upload failed for', file.name, err);
                    failed.push(file.name);
                }
            }

            setUploaded((prev) => [...prev, ...newGrid]);
            // Only clear the file list for successful items so the admin
            // can retry failures without re-selecting every file.
            const failedSet = new Set(failed);
            setFiles((prev) => prev.filter((f) => failedSet.has(f.name)));

            if (failed.length > 0) {
                setErrorMessage(
                    `Upload failed for ${failed.length} file${failed.length === 1 ? '' : 's'}: ${failed.join(', ')}`,
                );
            }
        } catch (err) {
            // Defensive catch — the inner loop already handles per-file
            // failures, but any unexpected throw (URL construction, etc.)
            // must not escape as an unhandled promise rejection.
            console.error('[UploadPage] Unexpected upload failure:', err);
            setErrorMessage(
                err instanceof Error
                    ? `Upload failed: ${err.message}`
                    : 'Upload failed with an unexpected error.',
            );
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
        setSelectedId(undefined);
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
    const handleExit = () => {
        if (isJourney) {
            returnHome('hopper', { ok: false, reason: 'cancel' });
        }
    };

    const tools: ToolKey[] = isJourney ? ['exit', 'delete', 'apply'] : ['delete'];
    const ctx: ToolbarCtx = {
        canSave: true,
        isSaving: false,
        exit: handleExit,
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

            {errorMessage && (
                <div className="upload-error" role="alert">
                    <span>{errorMessage}</span>
                    <button
                        type="button"
                        className="upload-error__dismiss"
                        onClick={() => setErrorMessage('')}
                        aria-label="Dismiss error"
                    >
                        ✕
                    </button>
                </div>
            )}

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
                    selectedItemId={selectedId}
                    setItemSelected={handleSelect}
                />
                <SingleEditorToolbar tools={tools} ctx={ctx} />
            </section>
        </div>
    );
}
