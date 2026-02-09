import { jsx as _jsx } from "react/jsx-runtime";
import { resolveSetter } from '@/shared/lib/resolvers/resolvers';
import { CtaBlockComponent } from './CtaBlockComponent';
import { GalleryComponent } from './GalleryComponent';
import { TextBlockComponent } from './TextBlockComponent';
export function BlockRenderer({ block, onHit, parent, setValue, readOnly }) {
    switch (block.blockKind) {
        case 'gallery':
            return (_jsx(GalleryComponent, { item: block, onHit: onHit, parent: parent, setValue: resolveSetter(setValue), readOnly: readOnly }, block.id));
        case 'text':
            return (_jsx(TextBlockComponent, { item: block, onHit: onHit, parent: parent, setValue: resolveSetter(setValue), readOnly: readOnly }, block.id));
        case 'cta':
            return (_jsx(CtaBlockComponent, { item: block, onHit: onHit, parent: parent, setValue: resolveSetter(setValue), readOnly: readOnly }, block.id));
        default:
            return null;
    }
}
