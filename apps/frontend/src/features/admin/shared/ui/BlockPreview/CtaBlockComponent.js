import { jsx as _jsx } from "react/jsx-runtime";
import '@/features/admin/blocks/ui/BlockTemplates/block.templates.css';
import { Hit } from '@/features/admin/blocks/ui/BlockTemplates/editorTypes';
export function CtaBlockComponent({ item, onHit }) {
    return (_jsx("div", { role: "button", className: `blk-cta-${item.target?.type} blk-cta`, onClick: (e) => onHit({
            block: item,
            hit: Hit.ctaButton(),
            nativeEvent: e,
        }), children: _jsx("div", { children: item.target?.type }) }));
}
