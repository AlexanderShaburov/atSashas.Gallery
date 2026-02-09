import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { CtaBlockComponent, GalleryComponent, TextBlockComponent, } from '@/features/admin/shared/ui/BlockPreview';
import './block.templates.css';
import { TEMPLATE_BLOCKS, createCtaTemplateBlock, createGalleryTemplateBlock, createTextTemplateBlock, } from './templateTypes';
export function TemplateRaw({ onSelectKind, setValue }) {
    return (_jsx(_Fragment, { children: TEMPLATE_BLOCKS.map((tpl, index) => {
            switch (tpl.kind) {
                case 'gallery':
                    return (_jsx("div", { className: "blk-tpl", children: _jsx(GalleryComponent, { item: {
                                ...createGalleryTemplateBlock(tpl.layout),
                                isTemplate: true,
                            }, onHit: onSelectKind, parent: "grid", setValue: setValue }) }, `${tpl.kind}-${tpl.layout}-${index}`));
                case 'cta':
                    return (_jsx("div", { className: "blk-tpl", children: _jsx(CtaBlockComponent, { item: { ...createCtaTemplateBlock(), isTemplate: true }, onHit: onSelectKind, parent: "grid", setValue: setValue }) }, `${tpl.kind}-${index}`));
                case 'text':
                    return (_jsx("div", { className: "blk-tpl", children: _jsx(TextBlockComponent, { item: { ...createTextTemplateBlock(), isTemplate: true }, onHit: onSelectKind, parent: "grid", setValue: setValue }) }, `${tpl.kind}-${index}`));
                default:
                    break;
            }
        }) }));
}
