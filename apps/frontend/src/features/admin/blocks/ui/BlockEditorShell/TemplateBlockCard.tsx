import { BlockKind, GalleryLayout } from '@/entities/block';
import {
    CtaBlockComponent,
    GalleryComponent,
    TextBlockComponent,
} from '@/features/admin/blocks/ui/BlockPreview';
import { TEMPLATE_BLOCKS, createGalleryTemplateBlock } from './templateTypes';

type TemplateBlockCardProps = {
    kind: BlockKind;
    layout?: GalleryLayout;
    label: string;
    onClick: () => void;
};

// Template Raw component:
type TemplateRawProps = {
    onSelectKind: (kind: BlockKind, layout?: GalleryLayout) => void;
};

export function TemplateRaw({ onSelectKind }: TemplateRawProps) {
    return (
        <>
            {TEMPLATE_BLOCKS.map((tpl, index) => (
                <TemplateBlockCard
                    key={
                        tpl.kind === 'gallery'
                            ? `${tpl.kind}-${tpl.layout}`
                            : tpl.kind + '-' + index
                    }
                    kind={tpl.kind}
                    layout={tpl.kind === 'gallery' ? tpl.layout : undefined}
                    label={tpl.label}
                    onClick={() => {
                        if (tpl.kind === 'gallery') {
                            onSelectKind('gallery', tpl.layout);
                        } else {
                            onSelectKind(tpl.kind);
                        }
                    }}
                />
            ))}
        </>
    );
}

export function TemplateBlockCard(props: TemplateBlockCardProps) {
    const { label, onClick } = props;

    const content = (() => {
        switch (props.kind) {
            case 'gallery':
                return <GalleryComponent isTemplate layout={props.layout} />;
            case 'text':
                return <TextBlockComponent isTemplate />;
            case 'cta':
                return <CtaBlockComponent isTemplate />;
            default:
                return <div>Template {props.kind}</div>;
        }
    })();

    return (
        <button type="button" className="template-block-card" onClick={onClick}>
            {content}
            <div className="template-block-overlay">
                <span className="template-block-plus">+</span>
                <span className="template-block-label">{label}</span>
            </div>
        </button>
    );
}
