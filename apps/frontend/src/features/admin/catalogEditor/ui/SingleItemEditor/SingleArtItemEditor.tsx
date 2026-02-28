// src/features/admin/catalogEditor/ui/SingleItemEditor/SingleArtItemEditor.tsx

import { CreateForm } from '@/features/admin/catalogEditor/ui/CreateForm/CreateForm';
import '@/features/admin/catalogEditor/ui/SingleItemEditor/SingleItemEditor.css';
import { SingleItemEditorProps } from '@/pages/admin/catalogEditorPage/catalogEditor.types';
import { ToolbarCtx, ToolKey } from '@/shared/ui/SingleEditorToolbar/single-editor-toolbar.types';
import { SingleEditorToolbar } from '@/shared/ui/SingleEditorToolbar/SingleEditorToolbar';
import { useEffect } from 'react';

export type SAProps = {
    editorProps: SingleItemEditorProps;
    toolbarProps: ToolbarCtx;
};
export default function SingleArtItemEditor(props: SAProps) {
    const { editorProps, toolbarProps } = props;
    const { draft, thumb, isDirty } = editorProps;
    const { canSave, isSaving, exit, save, onDelete } = toolbarProps;

    // onDelete now comes from toolbarProps (context's deleteById)
    // which uses the dependency-aware deletion system
    // Cmd + S, Esc
    //Cmd/Ctrl + S to save, Exc to cancel:
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!draft) return;
            const mod = /Mac/i.test(navigator.platform) ? e.metaKey : e.ctrlKey;

            if (mod && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (isDirty && save) save(); // ✅ save on Cmd/Ctrl+S
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                if (!isDirty || confirm('Discard unsaved changes?')) {
                    exit(); // ✅ cancel on Esc
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [exit, save, isDirty, draft, canSave]);

    const tbCtx = {
        canSave,
        isSaving,
        save,
        exit,
        onDelete, // Use onDelete from toolbarProps (context's deleteById)
    };
    const tbTools = ['delButton', 'exit', 'save'] as ToolKey[];

    return (
        <div className="sie-layout">
            {/* Thumbnail column */}
            <aside className="sie-thumb-col" aria-label="Selected artwork">
                <div className="sie-thumb-card">
                    <img src={thumb?.thumbUrl} alt={thumb?.title || thumb?.id} loading="lazy" />
                    <div className="sie-thumb-meta">
                        <div className="sie-thumb-id">{draft?.title?.en ?? thumb?.id}</div>
                    </div>
                </div>
            </aside>

            {/* Form column */}
            <section className="sie-form-col" aria-label="Metadata form">
                <div className="sie-form-wrap">
                    <CreateForm {...editorProps} />
                    <SingleEditorToolbar tools={tbTools} ctx={tbCtx} />
                </div>
            </section>
        </div>
    );
}
