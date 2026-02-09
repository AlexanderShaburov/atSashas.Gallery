import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Hit } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
export function TextBlockComponent({ item, onHit, parent }) {
    const isEditor = parent === 'editor';
    const titleText = item.title?.en?.trim() ?? '';
    const bodyText = item.body?.en?.trim() ?? '';
    // In editor we always render fields (with placeholders),
    // in grid we render only when there is content.
    const showTitle = isEditor || !!titleText;
    const showBody = isEditor || !!bodyText;
    return (_jsxs("div", { className: `blk-text ${isEditor ? 'blk--editor' : ''}`, children: [showTitle && (_jsx("div", { role: "button", className: [
                    isEditor ? 'blk-field blk-field--text-title' : 'blk-text__title',
                    !titleText ? 'is-empty' : '',
                ].join(' '), onClick: (e) => onHit({
                    block: item,
                    hit: Hit.textTitle(),
                    nativeEvent: e,
                }), children: titleText || 'Title' })), showBody && (_jsx("div", { role: "button", className: [
                    isEditor ? 'blk-field blk-field--text-body' : 'blk-text__body',
                    !bodyText ? 'is-empty' : '',
                ].join(' '), onClick: (e) => onHit({
                    block: item,
                    hit: Hit.textBody(),
                    nativeEvent: e,
                }), children: bodyText ? _jsx("p", { children: bodyText }) : _jsx("p", { children: "Place your text here" }) }))] }));
}
