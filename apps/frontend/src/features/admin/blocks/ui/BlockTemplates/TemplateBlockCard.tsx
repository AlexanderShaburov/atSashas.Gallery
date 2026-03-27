import { type Block, type BlockHitEvent, Hit } from '@/entities/block';
import {
    CtaBlockComponent,
    EventCtaBlockComponent,
    TextBlockComponent,
} from '@/features/admin/shared/ui/BlockPreview';
import { BlockThumbnail } from '@/shared/ui/BlockThumbnail';
import './block.templates.css';
import {
    TEMPLATE_BLOCKS,
    createCtaTemplateBlock,
    createEventCtaTemplateBlock,
    createGalleryTemplateBlock,
    createTextTemplateBlock,
} from './templateTypes';
type TemplateRawProps = {
    onSelectKind: (hit: BlockHitEvent) => void;
    setValue: (next: Block) => void;
};

export function TemplateRaw({ onSelectKind, setValue }: TemplateRawProps) {
    return (
        <>
            {TEMPLATE_BLOCKS.map((tpl, index) => {
                switch (tpl.kind) {
                    case 'gallery': {
                        const tplBlock = {
                            ...createGalleryTemplateBlock(tpl.layout),
                            isTemplate: true,
                        };
                        return (
                            <div
                                key={`${tpl.kind}-${tpl.layout}-${index}`}
                                className="blk-tpl"
                                onClick={(e) => {
                                    onSelectKind({
                                        block: tplBlock,
                                        hit: Hit.galleryImage('Center'),
                                        nativeEvent: e as React.MouseEvent<HTMLElement>,
                                    });
                                }}
                            >
                                <BlockThumbnail block={tplBlock} />
                            </div>
                        );
                    }
                    case 'cta':
                        return (
                            <div key={`${tpl.kind}-${index}`} className="blk-tpl">
                                <CtaBlockComponent
                                    item={{ ...createCtaTemplateBlock(), isTemplate: true }}
                                    onHit={onSelectKind}
                                    parent="grid"
                                    setValue={setValue}
                                />
                            </div>
                        );
                    case 'text':
                        return (
                            <div key={`${tpl.kind}-${index}`} className="blk-tpl">
                                <TextBlockComponent
                                    item={{ ...createTextTemplateBlock(), isTemplate: true }}
                                    onHit={onSelectKind}
                                    parent="grid"
                                    setValue={setValue}
                                />
                            </div>
                        );
                    case 'eventCta':
                        return (
                            <div key={`${tpl.kind}-${index}`} className="blk-tpl">
                                <EventCtaBlockComponent
                                    item={{
                                        ...createEventCtaTemplateBlock(),
                                        isTemplate: true,
                                    }}
                                    onHit={onSelectKind}
                                    parent="grid"
                                    setValue={setValue}
                                />
                            </div>
                        );
                    default:
                        break;
                }
            })}
        </>
    );
}
