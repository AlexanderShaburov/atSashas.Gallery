import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import GalleryBlock from '@/features/public/ui/GalleryBlock/GalleryBlock';
// Temp decision:
import { getCollection } from '@/features/admin/blocks/api/blocksApi';
import { useEffect, useState } from 'react';
export function GalleryStream(stream) {
    const [collection, setCollection] = useState(undefined);
    useEffect(() => {
        (async () => {
            const call = await getCollection();
            if (!call)
                throw new Error(`Collection download failed.`);
            setCollection(call.blocks);
        })();
    }, []);
    if (!collection)
        return _jsx("div", { children: "Loading..." });
    return (_jsxs("section", { className: "container gallery-page", children: [_jsx("header", { className: "page-header", children: _jsx("h1", { children: stream.title }) }), _jsx("div", { className: "gallery-stream", children: stream.blockIds.map((id) => {
                    const b = collection[id];
                    if (b)
                        return _jsx(GalleryBlock, { block: b }, id);
                }) })] }));
}
