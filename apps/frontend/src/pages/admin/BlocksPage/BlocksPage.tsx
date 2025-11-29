// pages/admin/BlocksPage.tsx
import { useState } from 'react';
import BlockEditor from '@/features/admin/blocks/BlockEditor/BlockEditor';
import './BlocksPage.css';

export default function BlocksPage() {
    const [mode, setMode] = useState<'edit' | 'create'>('create');
    return (
        <div className="blocks-page">
            <header className="block-page__header">
                <h1 className="blocks-page__title">Blocks</h1>

                <div className="blocks-page__mode-switch">
                    <button
                        type="button"
                        className={
                            'blocks-page__mode-btn' +
                            (mode === 'create' ? 'blocks-page__mode-btn--active' : '')
                        }
                        onClick={() => setMode('create')}
                    >
                        Create
                    </button>
                    <button
                        type="button"
                        className={
                            'blocks-page__mode-btn' +
                            (mode === 'edit' ? 'blocks-page__mode-btn--active' : '')
                        }
                        onClick={() => setMode('edit')}
                    >
                        Edit
                    </button>
                </div>
            </header>
            <BlockEditor />
        </div>
    );
}
