import { CreateForm } from '@/features/admin/ui/CreateForm/CreateForm';
import '@/features/admin/ui/SingleItemEditor/SingleItemEditor.css';
import { useEffect } from 'react';
import { useEditorSession } from '../../editorSession/EditorSession.context';

export default function SingleItemEditor() {
    const { thumb, save, values, isDirty, isValid, exit, canSave, saving } = {
        ...useEditorSession(),
    };

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
        console.log(`From SingleItemEditor component canSave visible as: ${canSave}`);
        return () => window.removeEventListener('keydown', onKey);
    }, [isValid, exit, save, isDirty, values, canSave]);

    return (
        <div className="sie-layout">
            {/* Thumbnail column */}
            <aside className="sie-thumb-col" aria-label="Selected artwork">
                <div className="sie-thumb-card">
                    <img src={thumb?.src} alt={thumb?.alt || thumb?.id} loading="lazy" />
                    <div className="sie-thumb-meta">
                        <div className="sie-thumb-id">{values?.title?.en ?? thumb?.id}</div>
                    </div>
                </div>
            </aside>

            {/* Form column */}
            <section className="sie-form-col" aria-label="Metadata form">
                <div className="sie-form-wrap">
                    <CreateForm />

                    <div className="sie-toolbar">
                        <div className="sie-toolbar-spacer" />
                        <div className="sie-actions">
                            <button
                                type="button"
                                className="sie-btn sie-btn--secondary"
                                onClick={() => exit()}
                            >
                                ✖ Exit
                            </button>
                            <button
                                type="button"
                                className="sie-btn sie-btn--primary"
                                disabled={!canSave || saving}
                                onClick={() => !saving && canSave && save()}
                                title={
                                    !canSave
                                        ? 'Complete required fields'
                                        : saving
                                          ? 'Saving...'
                                          : 'Save'
                                }
                            >
                                {canSave ? '💾 Save' : 'Saving…'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
