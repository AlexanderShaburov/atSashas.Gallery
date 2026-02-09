// src/features/admin/catalogEditor/ui/SingleItemEditor/SingleArtItemEditor.tsx

import { deleteFromHopper } from '@/features/admin/catalogEditor/api';
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
    const { canSave, isSaving, exit, save } = toolbarProps;

    // *********************************************
    // ❗️ To be moved to the context provider ❗️
    async function deleteFromCatalog() {
        if (!thumb?.id) return;

        try {
            // Check dependencies:
            const depsResp = await fetch(`/api/art/dependencies/${thumb.id}`);
            const deps = await depsResp.json();

            let message = `Delete item "${thumb.id}" permanently?`;

            // User message
            if (deps.blocks?.length || deps.streams?.length) {
                message =
                    `This item is used in:\n\n` +
                    (deps.blocks.length ? `Blocks:\n- ${deps.blocks.join('\n- ')}\n\n` : '') +
                    (deps.streams.length ? `Streams:\n- ${deps.streams.join('\n- ')}` : '') +
                    `\n\nAre you sure you want to delete it?`;
            }

            // Confirmation
            if (!confirm(message)) return;

            // Deleting
            const delResp = await fetch(`/api/catalog/${thumb.id}`, {
                method: 'DELETE',
            });

            if (!delResp.ok) {
                alert('Failed to delete item');
                return;
            }
        } catch (err) {
            console.error(err);
            alert('Error during deletion');
        }
    }

    async function onDelete() {
        switch (draft?.lifecycle) {
            case 'saved':
                await deleteFromCatalog();
                break;
            case 'draft':
                if (thumb && thumb.id) {
                    await deleteFromHopper(thumb.id);
                }
                break;
        }
        exit();
    }

    // Until this ❗️❗️❗️
    // *********************************************
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
        onDelete: onDelete,
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
