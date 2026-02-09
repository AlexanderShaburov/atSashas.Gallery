import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useGallery } from '@/features/public/hooks/useGallery';
import { GalleryStream } from '@/features/public/ui/GalleryStream/GalleryStream';
import { useParams } from 'react-router-dom';
export default function GalleryPage() {
    const { slug = '' } = useParams();
    const { stream, loading, error } = useGallery(slug);
    if (loading)
        return _jsx("div", { className: "infoContainer", children: "Loading..." });
    if (error)
        return _jsxs("div", { className: "infoContainer", children: ["Error: ", error] });
    if (!stream)
        return _jsx("div", { className: "infoContainer", children: "Not found." });
    return (_jsx("div", { className: "???", children: _jsx(GalleryStream, { ...stream }) }));
}
