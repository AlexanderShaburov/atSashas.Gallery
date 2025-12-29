import { deleteFromHopper } from '@/features/admin/catalogEditor/api';
import { useEditorSession } from '@/features/admin/catalogEditor/editorSession/CatalogEditorSession.context';
import { CreateForm } from '@/features/admin/catalogEditor/ui/CreateForm/CreateForm';
import '@/features/admin/catalogEditor/ui/SingleItemEditor/SingleItemEditor.css';
import { SingleEditorToolbar } from '@/shared/ui/SingleEditorToolbar/SingleEditorToolbar';
import { useEffect } from 'react';
export default function SingleItemEditor() {
    const { thumb, save, values, isDirty, isValid, exit, canSave, saving, mode } = {
        ...useEditorSession(),
    };
    console.log(`Current thumb is: `);
    console.log(`current thumb.thumbUrl: ${thumb?.thumbUrl}`);
    console.dir(thumb);

    // TODO:
    // When Blocks and Streams are implemented:
    // - check real dependencies
    // - prevent deletion if item is part of locked or published stream
    // - implement placeholder item for removed artworks
    // - update blocks by replacing removed item with placeholder token

    async function deleteFromCatalog() {
        if (!thumb?.id) return;

        try {
            // Check dependencies:
            const depsResp = await fetch(`/api/catalog/dependencies/${thumb.id}`);
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
        switch (mode) {
            case 'edit':
                await deleteFromCatalog();
                break;
            case 'create':
                if (thumb && thumb.id) {
                    await deleteFromHopper(thumb.id);
                }
                break;
        }
        exit();
    }
    //Cmd/Ctrl + S to save, Exc to cancel:
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!values) return;
            const mod = /Mac/i.test(navigator.platform) ? e.metaKey : e.ctrlKey;

            if (mod && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (isValid && isDirty) save(); // ✅ save on Cmd/Ctrl+S
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
    }, [isValid, exit, save, isDirty, values, canSave]);

    return (
        <div className="sie-layout">
            {/* Thumbnail column */}
            <aside className="sie-thumb-col" aria-label="Selected artwork">
                <div className="sie-thumb-card">
                    <img src={thumb?.thumbUrl} alt={thumb?.title || thumb?.id} loading="lazy" />
                    <div className="sie-thumb-meta">
                        <div className="sie-thumb-id">{values?.title?.en ?? thumb?.id}</div>
                    </div>
                </div>
            </aside>

            {/* Form column */}
            <section className="sie-form-col" aria-label="Metadata form">
                <div className="sie-form-wrap">
                    <CreateForm />
                    <SingleEditorToolbar
                        canSave={canSave}
                        saving={saving}
                        save={save}
                        exit={exit}
                        onDelete={onDelete}
                    />
                </div>
            </section>
        </div>
    );
}
