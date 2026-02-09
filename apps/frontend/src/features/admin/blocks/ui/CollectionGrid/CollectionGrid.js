import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createGalleryTemplateBlock } from '@/features/admin/blocks/ui/BlockTemplates';
import { TemplateRaw } from '@/features/admin/blocks/ui/BlockTemplates/TemplateBlockCard';
import { BlockRenderer } from '@/features/admin/shared/ui/BlockPreview/BlockRenderer';
import { todayISO } from '@/shared/lib/dateAndLabels/today';
import './blocks.grid.css';
export function CollectionGrid({ collection, onHit, setValue }) {
    let safeCollection;
    if (!collection) {
        safeCollection = {
            kind: 'BlockCollection',
            collectionId: '',
            collectionName: 'empty',
            version: 0,
            updatedAt: todayISO(),
            generatedAt: todayISO(),
            blocks: { template: createGalleryTemplateBlock('single') },
            order: [],
        };
    }
    else {
        safeCollection = collection;
    }
    return (_jsxs("div", { className: "grid-collection", children: [_jsx(TemplateRaw, { onSelectKind: onHit, setValue: setValue }), safeCollection.order.map((item) => {
                const b = safeCollection.blocks[item];
                if (b)
                    return (_jsx(BlockRenderer, { block: b, onHit: onHit, parent: "grid", setValue: setValue }, b.id));
            })] }));
}
