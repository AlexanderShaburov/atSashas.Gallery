import { Block } from '@/entities/block';
import {
    CtaBlockComponent,
    GalleryComponent,
    TextBlockComponent,
} from '@/features/admin/shared/ui/BlockPreview';
import { Dispatch, SetStateAction } from 'react';
import './block.templates.css';
import { BlockHitEvent } from './editorTypes';
import {
    TEMPLATE_BLOCKS,
    createCtaTemplateBlock,
    createGalleryTemplateBlock,
    createTextTemplateBlock,
} from './templateTypes';
type TemplateRawProps = {
    onSelectKind: (hit: BlockHitEvent) => void;
    setValue: Dispatch<SetStateAction<Block | undefined>>;
};

export function TemplateRaw({ onSelectKind, setValue }: TemplateRawProps) {
    return (
        <>
            {TEMPLATE_BLOCKS.map((tpl, index) => {
                switch (tpl.kind) {
                    case 'gallery':
                        return (
                            <div key={`${tpl.kind}-${tpl.layout}-${index}`} className="blk-tpl">
                                <GalleryComponent
                                    item={{
                                        ...createGalleryTemplateBlock(tpl.layout),
                                        isTemplate: true,
                                    }}
                                    onHit={onSelectKind}
                                    parent="grid"
                                    setValue={setValue}
                                />
                            </div>
                        );
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
                    default:
                        break;
                }
            })}
        </>
    );
}
