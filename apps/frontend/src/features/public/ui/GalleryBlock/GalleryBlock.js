import { jsx as _jsx } from "react/jsx-runtime";
import ImageComponent from '@/features/public/ui/Image/ImageComponent';
import TextComponent from '@/features/public/ui/Text/TextComponent';
import './gallery.css';
export default function GalleryBlock({ block }) {
    if (block.blockKind === 'gallery') {
        return _jsx(ImageComponent, { block: block });
    }
    else if (block.blockKind === 'text') {
        return _jsx(TextComponent, { block: block });
    }
    else {
        return _jsx("div", { className: "container", children: "Unknown block type." });
    }
}
