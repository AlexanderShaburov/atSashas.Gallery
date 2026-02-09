import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { deleteFromHopper, getHopperContent, uploadImage, } from '@/features/admin/catalogEditor/api';
import { useArrival, useReturnHome } from '@/features/admin/shared/transporter/transporter';
import ArtItemGrid from '@/features/admin/shared/ui/ArtItemGrid/ArtItemGrid';
import '@/pages/admin/Upload.css';
import { generateId } from '@/shared/lib/id/generateId';
import { SingleEditorToolbar } from '@/shared/ui/SingleEditorToolbar/SingleEditorToolbar';
import { useEffect, useState } from 'react';
export default function UploadPage() {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isJourney, setIsJourney] = useState(false);
    const arrival = useArrival();
    const returnHome = useReturnHome();
    // Handle grid selection ( deselect: undefined)
    const handleSelect = (item) => {
        if (!item) {
            setSelectedId(null);
            return;
        }
        setSelectedId(item.id);
    };
    // ************** BOOTSTRAP MOUNT ***************
    useEffect(() => {
        (async () => {
            // Download hopper content once at page load
            const artItemGrid = await getHopperContent();
            console.log(`[UploadPage]: artItemGrid (Hopper) is: `);
            console.dir(artItemGrid);
            setUploaded(artItemGrid);
            const ticket = arrival('hopper');
            if (!ticket)
                return;
            if (ticket.phase === 'return')
                throw new Error(`Hooper bootstrap got return ticket`);
            setIsJourney(true);
        })();
    }, [arrival]);
    // ************* HANDLERS SECTION *************
    async function handleUpload() {
        if (!files.length)
            return;
        setUploading(true);
        try {
            const newGrid = [];
            for (const file of files) {
                const { url, ok } = await uploadImage(file, 'hopper');
                if (ok && url) {
                    newGrid.push({ id: generateId('art'), thumbUrl: url });
                }
            }
            setUploaded((prev) => [...prev, ...newGrid]);
            setFiles([]);
        }
        finally {
            setUploading(false);
        }
    }
    // ------------- APPLY Handler ----------------
    const handleApply = () => {
        if (!isJourney)
            return;
        if (!selectedId)
            return;
        const image = uploaded.find((i) => i.id === selectedId);
        const loot = {
            ok: true,
            id: selectedId,
            output: image,
        };
        returnHome('hopper', loot);
    };
    // ------------- DELETE Handler ---------------
    // Remove on FE for now
    function handleDelete() {
        if (!selectedId)
            return;
        setUploaded((prev) => prev.filter((t) => t.id !== selectedId));
        console.log(`filename to be deleted: ${selectedId}`);
        deleteFromHopper(selectedId);
        setSelectedId(null);
    }
    // ---- Drag & drop handlers for drop zone ----
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    function handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const dropped = Array.from(e.dataTransfer.files || []);
        if (!dropped.length)
            return;
        setFiles((prev) => [...prev, ...dropped]);
    }
    const tools = isJourney ? ['delete', 'apply'] : ['delete'];
    const ctx = {
        canSave: true,
        isSaving: false,
        exit: () => { },
        onDelete: handleDelete,
        onApply: handleApply,
    };
    return (_jsxs("div", { className: "upload-page", children: [_jsx("h1", { children: "Upload artworks" }), _jsxs("section", { className: `upload-drop ${isDragging ? 'upload-drop--drag-over' : ''}`, onDragOver: handleDragOver, onDragEnter: handleDragEnter, onDragLeave: handleDragLeave, onDrop: handleDrop, children: [_jsx("div", { className: "upload-input-overlay", children: _jsx("input", { className: "upload-file-input", type: "file", multiple: true, onChange: (e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]) }) }), _jsx("p", { className: "upload-drop-title", children: "Drag & drop files here or click to choose" }), files.length > 0 && (_jsxs("div", { className: "upload-drop-files", children: [_jsx("p", { children: "Files ready to upload:" }), _jsx("ul", { children: files.map((file) => (_jsxs("li", { children: [_jsx("span", { className: "upload-drop-file-name", children: file.name }), _jsxs("span", { className: "upload-drop-file-size", children: [(file.size / 1024).toFixed(1), " KB"] })] }, `${file.name}-${file.lastModified}`))) })] }))] }), files.length > 0 && (_jsx("div", { className: "upload-actions", children: _jsx("button", { onClick: handleUpload, disabled: uploading, className: "btn", children: uploading ? 'Uploading...' : `Start upload (${files.length})` }) })), _jsxs("section", { className: "upload-list", children: [_jsxs("div", { className: "upload-list-header", children: [_jsx("h2", { children: "Uploaded Files" }), _jsx("button", { className: "btn btn-danger", disabled: !selectedId, onClick: handleDelete, children: "Delete Selected" })] }), _jsx(ArtItemGrid, { artCollection: uploaded, selectedItemId: undefined, setItemSelected: handleSelect }), _jsx(SingleEditorToolbar, { tools: tools, ctx: ctx })] })] }));
}
