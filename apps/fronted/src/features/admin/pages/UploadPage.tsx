import { useState } from "react"
import { uploadImage } from "../api"
import HopperGrid from "@features/admin/components/HopperGrid";
import './upload.css'



export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState<string[]>([]);

    async function handleUpload() {
        if (!files.length) return;
        setUploading(true);
        try {
            const urls: string[] = [];
            for (const file of files) {
                const {url} = await uploadImage(file, 'hopper');
                urls.push(url);
            }
            setUploaded((prev) => [...prev, ...urls]);
            setFiles([]);
        } finally {
            setUploading(false);
        }
    }


    return (
    <div className="upload-page" >
        <h1>Upload artworks</h1>

        <section className="upload-drop">
            <input 
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            {files.length > 0 && (
                <button onClick={handleUpload} disabled={uploading} className="btn">
                    {uploading ? 'Uploading...' : 'Start Upload'}
                </button>
            )}
        </section>
        <section className="upload-list">
            <h2>Uploaded Files</h2>
            <HopperGrid items={uploaded} />

        </section>
    </div>)
}