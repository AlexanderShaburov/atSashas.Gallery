import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getFromCatalog } from '@/features/public/api/catalogModule';
export default function ImageComponent({ block }) {
    const { layout, items } = { ...block };
    return (_jsx("figure", { className: `block ${layout}`, children: items.map((item) => {
            const img = getFromCatalog(item.artId);
            if (!img)
                return null;
            return (_jsxs("picture", { role: "button", onClick: () => open(img.images.full), children: [_jsx("source", { type: "image/avif", srcSet: img.images.preview.avif }), _jsx("source", { type: "image/webp", srcSet: img.images.preview.webp }), _jsx("img", { src: img.images.preview.jpeg, alt: img.images.alt.en || '', loading: "lazy" })] }, img.id));
        }) }));
}
