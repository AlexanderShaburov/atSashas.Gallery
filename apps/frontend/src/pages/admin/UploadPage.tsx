import { ArtGerm } from '@/entities/art';
import { Thumb } from '@/entities/catalog';
import { getHopperContent, uploadImage } from '@/features/admin/api';
import HopperGrid from '@/features/admin/ui/HopperGrid/HopperGrid';
import '@/pages/admin/Upload.css';
import { useEffect, useState } from 'react';

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState<Thumb[]>([]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const noopSelect = (_thumb: ArtGerm | undefined) => {}; // Do nothing

    useEffect(() => {
        (async () => {
            const t = await getHopperContent();
            console.log(`Hopper content loaded and is: ${t}`);
            console.dir(t);
            setUploaded(t);
        })();
    }, []);
    async function handleUpload() {
        console.log(`Upload called with.`);

        if (!files.length) return;
        setUploading(true);
        try {
            const newThumbs: Thumb[] = [];

            for (const file of files) {
                console.log(`cycle for ${file.name}`);
                const { url, ok } = await uploadImage(file, 'hopper');

                console.log(`url: ${url}`);
                if (ok && url) {
                    const thumb: Thumb = {
                        id: file.name,
                        src: url,
                    };
                    newThumbs.push(thumb);
                }
            }

            setUploaded((prev) => [...prev, ...newThumbs]);
            setFiles([]);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="upload-page">
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
                <HopperGrid hopper={uploaded} setIdentity={noopSelect} />
            </section>
        </div>
    );
}
