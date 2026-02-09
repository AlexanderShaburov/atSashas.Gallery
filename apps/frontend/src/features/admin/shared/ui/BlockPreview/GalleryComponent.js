import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Hit, } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
import { TEMPLATE_BLOCKS } from '@/features/admin/blocks/ui/BlockTemplates/templateTypes';
import { InlineEditableText } from '@/features/admin/shared/ui/BlockPreview';
import { useResolveArt } from '@/shared/ArtCatalogProvider/CatalogHook';
const ITEM_POSITIONS = {
    single: ['Center'],
    pairHorizontal: ['Left', 'Right'],
    pairVertical: ['Up', 'Bottom'],
    triptychLeft: ['LS', 'RUC', 'RBC'],
    triptychRight: ['LUC', 'LBC', 'RS'],
    triptychHorizontal: ['Left', 'Center', 'Right'],
};
function posClass(pos) {
    return pos.toLowerCase();
}
function isTriptychHorizontal(layout) {
    return layout === 'triptychHorizontal';
}
export function GalleryComponent({ item, onHit, parent, setValue, readOnly }) {
    const isEditor = parent === 'editor';
    const imgPositions = ITEM_POSITIONS[item.layout];
    const resolveArt = useResolveArt();
    const tpl = TEMPLATE_BLOCKS.find((t) => t.kind === item.blockKind && t.layout === item.layout);
    const label = tpl?.label;
    const renderCaptionValue = (value, placeholder, className) => {
        // readOnly=true => показываем только реально существующие caption'ы (без плейсхолдеров)
        if (readOnly)
            return value ? _jsx("div", { className: className, children: value }) : null;
        // readOnly=false/undefined => как в редакторе: показываем плейсхолдер в editor, а в grid только если есть текст
        const shouldShow = isEditor || !!value;
        if (!shouldShow)
            return null;
        return _jsx("div", { className: className, children: value || placeholder });
    };
    const renderInlineOrCaption = (opts) => {
        const content = renderCaptionValue(opts.value, opts.placeholder, opts.className);
        if (!content)
            return null;
        // readOnly=true => никогда не используем InlineEditableText
        if (readOnly)
            return content;
        return (_jsx(InlineEditableText, { block: opts.block, target: opts.target, currentTextValue: opts.value, className: opts.className, hit: opts.hit, onCommit: opts.onCommit, children: (p) => opts.renderWrapper ? (opts.renderWrapper(p, content)) : (_jsx("div", { ...p, children: opts.value || opts.placeholder })) }));
    };
    const renderItemCaption = (pos, blockItem) => {
        const current = blockItem?.caption?.en ?? '';
        const className = ['blk-field', 'blk-field--slot-caption', current ? '' : 'is-empty']
            .filter(Boolean)
            .join(' ');
        const target = {
            blockKind: 'gallery',
            slot: pos,
            kind: 'imageCaption',
        };
        return renderInlineOrCaption({
            value: current,
            placeholder: 'Item caption',
            className,
            block: item,
            target,
            hit: Hit.galleryCaption(pos),
            onCommit: (draft) => {
                const next = draft ?? '';
                const newItem = {
                    ...item,
                    items: item.items.map((i) => i.position === pos
                        ? { ...i, caption: { ...(i.caption ?? {}), en: next } }
                        : i),
                };
                setValue(newItem);
            },
        });
    };
    const renderBlockCaption = () => {
        const current = item.caption?.en ?? '';
        const className = [
            'blk-field',
            'blk-field--block-caption',
            item.isTemplate ? '' : current ? '' : 'is-empty',
        ].join(' ');
        // readOnly=true => показываем только если реально есть caption
        if (readOnly) {
            return current ? _jsx("figcaption", { className: className, children: current }) : null;
        }
        return (_jsx(InlineEditableText, { block: item, target: {
                blockKind: 'gallery',
                slot: undefined,
                kind: 'blockCaption',
            }, currentTextValue: current, className: className, hit: Hit.galleryBlockCaption(), onCommit: (draft) => {
                const next = draft ?? '';
                const newItem = {
                    ...item,
                    caption: { ...(item.caption ?? {}), en: next },
                };
                setValue(newItem);
            }, children: (p) => (_jsx("figcaption", { ...p, children: item.isTemplate
                    ? label || tpl?.kind || 'Gallery template'
                    : current || 'Block caption' })) }));
    };
    return (_jsxs("figure", { className: `blk-${item.blockKind} ${isEditor ? 'blk--editor' : ''}`, children: [imgPositions.map((pos) => {
                const blockItem = item.items.find((i) => i.position === pos);
                const imgId = blockItem?.artId;
                const slotBaseClass = `blk-gallery__slot blk-gallery__slot-${posClass(pos)}${isTriptychHorizontal(item.layout) ? '-horizontal' : ''}`;
                // --- EMPTY SLOT (no artId) ---
                if (!imgId) {
                    return (_jsxs("div", { className: `${slotBaseClass} blk-gallery__slot-empty`, children: [_jsx("div", { role: "button", className: "blk-gallery__slot-media", onClick: (e) => onHit({
                                    block: item,
                                    hit: Hit.galleryImage(pos),
                                    nativeEvent: e,
                                }) }), renderItemCaption(pos, blockItem)] }, pos));
                }
                // --- HAVE artId: resolve art ---
                const img = resolveArt(imgId);
                // --- MISSING ART (not found in catalog) ---
                if (!img) {
                    return (_jsxs("div", { className: `${slotBaseClass} blk-gallery__slot-missing`, children: [_jsxs("div", { role: "button", className: "blk-gallery__slot-media", onClick: (e) => onHit({
                                    block: item,
                                    hit: Hit.galleryImage(pos),
                                    nativeEvent: e,
                                }), children: ["Missing art: ", imgId] }), renderItemCaption(pos, blockItem)] }, `${imgId}-${pos}`));
                }
                // --- NORMAL ART ---
                return (_jsxs("div", { className: slotBaseClass, children: [_jsxs("picture", { role: "button", className: "blk-gallery__slot-media", onClick: (e) => onHit({
                                block: item,
                                hit: Hit.galleryImage(pos),
                                nativeEvent: e,
                            }), children: [_jsx("source", { type: "image/avif", srcSet: img.images.preview.avif }), _jsx("source", { type: "image/webp", srcSet: img.images.preview.webp }), _jsx("img", { src: img.images.preview.jpeg, alt: img.images.alt?.en || '', loading: "lazy" })] }), renderItemCaption(pos, blockItem)] }, `${imgId}-${pos}`));
            }), renderBlockCaption()] }));
}
