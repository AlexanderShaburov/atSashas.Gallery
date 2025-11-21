import { Thumb } from '@/entities/catalog';
import { GridItem } from '@/entities/grid';
import { deleteFromHopper, getHopperContent, uploadImage } from '@/features/admin/api';
import HopperGrid from '@/features/admin/ui/HopperGrid/HopperGrid';
import '@/pages/admin/Upload.css';
import { useEffect, useState, type DragEvent } from 'react';

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState<GridItem[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Handle grid selection ( deselect: undefined)
    const handleSelect = (item: GridItem | undefined) => {
        if (!item) {
            setSelectedId(null);
            return;
        }
        setSelectedId(item.id);
    };

    function thumbToGridItem(t: Thumb): GridItem {
        return {
            id: t.id,
            thumbUrl: t.src,
        };
    }

    useEffect(() => {
        (async () => {
            const t = await getHopperContent();
            const hopperGrid = t.map(thumbToGridItem);
            setUploaded(hopperGrid);
        })();
    }, []);

    async function handleUpload() {
        if (!files.length) return;
        setUploading(true);
        try {
            const newGrid: GridItem[] = [];

            for (const file of files) {
                const { url, ok } = await uploadImage(file, 'hopper');

                if (ok && url) {
                    const item: GridItem = {
                        id: file.name,
                        thumbUrl: url,
                    };
                    newGrid.push(item);
                }
            }

            setUploaded((prev) => [...prev, ...newGrid]);
            setFiles([]);
        } finally {
            setUploading(false);
        }
    }

    // Remove on FE for now
    function handleDelete() {
        if (!selectedId) return;
        setUploaded((prev) => prev.filter((t) => t.id !== selectedId));
        console.log(`filename to be deleted: ${selectedId}`);
        deleteFromHopper(selectedId);
        setSelectedId(null);
    }

    // ---- Drag & drop handlers для зоны ----

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

                    <button
                        className="btn btn-danger"
                        disabled={!selectedId}
                        onClick={handleDelete}
                    >
                        Delete Selected
                    </button>
                </div>

                <HopperGrid hopper={uploaded} setIdentity={handleSelect} />
            </section>
        </div>
    );
}
