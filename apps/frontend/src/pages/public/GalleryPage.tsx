import { JSX } from 'react';
import { useParams } from 'react-router-dom';
import { useGallery } from '../../features/gallery/hooks/useGallery';
import { GalleryStream } from '../../features/gallery/ui/GalleryStream/GalleryStream';

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
