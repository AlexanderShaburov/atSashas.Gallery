import type { Thumb } from '@/entities/catalog';
import { CreateFormProps, CreateFormValues } from '@/features/admin/ui/CreateForm/CreateForm';
import '@/features/admin/ui/SingleItemEditor/SingleItemEditor.css';
import React, { useEffect } from 'react';

interface Props {
    thumb: Thumb; // the selected item
    FormComponent: React.ComponentType<CreateFormProps>; // metadata form
    formProps: CreateFormProps;
    values: CreateFormValues | null; // latest values from parent
    onSave: (v: CreateFormValues) => void; // parent-provided save
    onCancel: () => void; // parent-provided cancel
    saving?: boolean; // show "Saving…" & disable
    title?: string; // optional heading (e.g., item id or title)
    onBack?: () => void; // optional back to grid

    // Optional helpers for UX
    isValid?: (v: CreateFormValues) => boolean; // if omitted, Save is always enabled when values exist
    isDirty?: (v: CreateFormValues) => boolean; // to warn before cancel
}

export default function SingleItemEditor({
    thumb,
    FormComponent,
    formProps,
    values,
    onSave,
    onCancel,
    saving = false,
    title,
    onBack,
    isValid,
    isDirty,
}: Props) {
    const canSave = !!values && (isValid ? isValid(values) : true) && !saving;

    //Cmd/Ctrl + S to save, Exc to cancel:
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!values) return;
            const mod = /Mac/i.test(navigator.platform) ? e.metaKey : e.ctrlKey;

            if (mod && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (canSave) onSave(values); // ✅ save on Cmd/Ctrl+S
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                if (!isDirty || !isDirty(values) || confirm('Discard unsaved changes?')) {
                    onCancel(); // ✅ cancel on Esc
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [values, canSave, onSave, onCancel, isDirty]);

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
                <div className="sie-form-wrap">
                    <FormComponent {...formProps} />

                    <div className="sie-toolbar">
                        {onBack && (
                            <button type="button" className="sie-btn" onClick={onBack}>
                                ← Back
                            </button>
                        )}
                        <div className="sie-toolbar-spacer" />
                        <div className="sie-actions">
                            <button
                                type="button"
                                className="sie-btn sie-btn--secondary"
                                onClick={() => {
                                    if (!values) return;
                                    if (
                                        !isDirty ||
                                        !isDirty(values) ||
                                        confirm('Discard unsaved changes?')
                                    ) {
                                        onCancel();
                                    }
                                }}
                            >
                                ✖ Cancel
                            </button>
                            <button
                                type="button"
                                className="sie-btn sie-btn--primary"
                                disabled={!canSave}
                                onClick={() => values && onSave(values)}
                                title={
                                    !values
                                        ? 'Fill the form'
                                        : !canSave
                                          ? 'Complete required fields'
                                          : 'Save'
                                }
                            >
                                {saving ? 'Saving…' : '💾 Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
