import type { Thumb } from '@/entities/catalog';
import React from 'react';
import { CreateFormProps } from '@/features/admin/ui/CreateForm/CreateForm';
import '@/features/admin/ui/SingleItemEditor/SingleItemEditor.module.css';

interface Props {
    thumb: Thumb; // the selected item
    FormComponent: React.ComponentType<CreateFormProps>; // metadata form
    onBack?: () => void; // optional Back to grid
    title?: string; // optional heading (e.g., item id or title)
    formProps: CreateFormProps;
}

export default function SingleItemEditor({
    thumb,
    FormComponent,
    onBack,
    title,
    formProps,
}: Props) {
    return (
        <div className="sie-layout">
            {/* Thumbnail column */}
            <aside className="sie-thumb-col" aria-label="Selected artwork">
                <div className="sie-thumb-card">
                    <img src={thumb.src} alt={thumb.alt || thumb.id} loading="lazy" />
                    <div className="sie-thumb-meta">
                        <div className="sie-thumb-id">{title ?? thumb.id}</div>
                    </div>
                </div>
            </aside>

            {/* Form column */}
            <section className="sie-form-col" aria-label="Metadata form">
                <div className="sie-toolbar">
                    {onBack && (
                        <button type="button" className="sie-btn" onClick={onBack}>
                            ← Back
                        </button>
                    )}
                    <div className="sie-toolbar-spacer" />
                </div>
                <div className="sie-form-wrap">
                    <FormComponent {...formProps} />
                </div>
            </section>
        </div>
    );
}
