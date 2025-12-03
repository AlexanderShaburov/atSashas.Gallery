import { BlockKind, GalleryLayout } from '@/entities/block';
import {
    CtaBlockComponent,
    GalleryComponent,
    TextBlockComponent,
} from '@/features/admin/blocks/ui/BlockPreview';
import {
    TEMPLATE_BLOCKS,
    createCtaTemplateBlock,
    createGalleryTemplateBlock,
    createTextTemplateBlock,
} from './templateTypes';

type TemplateGalleryBlockCardProps = {
    kind: 'gallery';
    layout: GalleryLayout;
    label: string;
    onClick: () => void;
};
type TemplateTextBlockCardProps = {
    kind: 'text';
    label: string;
    onClick: () => void;
};
type TemplateCtaBlockCardProps = {
    kind: 'cta';
    label: string;
    onClick: () => void;
};

type TemplateBlockCardProps =
    | TemplateGalleryBlockCardProps
    | TemplateTextBlockCardProps
    | TemplateCtaBlockCardProps;

// Template Raw component:
type TemplateRawProps = {
    onSelectKind: (kind: BlockKind, layout?: GalleryLayout) => void;
};

export function TemplateRaw({ onSelectKind }: TemplateRawProps) {
    return (
        <>
            {TEMPLATE_BLOCKS.map((tpl, index) => {
                if (tpl.kind === 'gallery') {
                    return (
                        <TemplateBlockCard
                            key={`${tpl.kind}-${tpl.layout}`}
                            kind="gallery"
                            layout={tpl.layout}
                            label={tpl.label}
                            onClick={() => onSelectKind('gallery', tpl.layout)}
                        />
                    );
                } else {
                    return (
                        <TemplateBlockCard
                            key={tpl.kind + '-' + index}
                            kind={tpl.kind}
                            label={tpl.label}
                            onClick={() => onSelectKind(tpl.kind)}
                        />
                    );
                }
            })}
        </>
    );
}

export function TemplateBlockCard(props: TemplateBlockCardProps) {
    const { label, onClick } = props;

    const content = (() => {
        switch (props.kind) {
            case 'gallery':
                return (
                    <GalleryComponent
                        item={createGalleryTemplateBlock(props.layout)}
                        onClick={() => onClick()}
                    />
                );
            case 'text':
                return <TextBlockComponent item={createTextTemplateBlock()} onClick={onClick} />;
            case 'cta':
                return <CtaBlockComponent item={createCtaTemplateBlock()} onClick={onClick} />;
            default:
                return <div>Unrecognized Template Kind</div>;
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
