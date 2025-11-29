import { useGallery } from '@/features/public/hooks/useGallery';
import { GalleryStream } from '@/features/public/ui/GalleryStream/GalleryStream';
import { JSX } from 'react';
import { useParams } from 'react-router-dom';

export default function GalleryPage(): JSX.Element {
    const { slug = '' } = useParams();

    const { stream, loading, error } = useGallery(slug);

    if (loading) return <div className="infoContainer">Loading...</div>;
    if (error) return <div className="infoContainer">Error: {error}</div>;
    if (!stream) return <div className="infoContainer">Not found.</div>;
    return (
        <div className="???">
            <GalleryStream {...stream} />
        </div>
    );
}
