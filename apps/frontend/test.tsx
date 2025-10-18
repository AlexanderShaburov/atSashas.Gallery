if (loading) {
    return <div className="empty">Загружаю превью…</div>;
}
if (error) {
    return (
        <div className="empty" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
            Ошибка: {error}
        </div>
    );
}
if (!draft) {
    return <div className="empty">Выберите превью слева, чтобы начать.</div>;
}
return (
    <div className="form-grid">
        {' '}
        // Main (all page) frame
        <div className="form-field">
            {' '}
            // Series input frame
            <label className="form-label">Серия</label>
            <input
                className="form-input"
                value={draft.series ?? ''}
                onChange={(e) => updateDraft({ series: e.target.value || null })}
            />
        </div>
        <div className="form-field">
            {' '}
            // Tegs
            <label className="form-label">Теги (через запятую)</label>
            <input
                className="form-input"
                value={(draft.tags ?? []).join(', ')}
                onChange={(e) =>
                    updateDraft({
                        tags: e.target.value.split(/\s*,\s*/).filter(Boolean),
                    })
                }
            />
        </div>
        <div className="form-row-3">
            {' '}
            // ALL DIMENTIONS
            <div className="form-field">
                {' '}
                // Dimentions width frame
                <label className="form-label">Ширина</label>
                <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={draft.dimensions.width}
                    onChange={(e) =>
                        updateDraft({
                            dimensions: { ...draft.dimensions, width: Number(e.target.value) },
                        })
                    }
                />
            </div>
            <div className="form-field">
                {' '}
                // Dimentions height frame
                <label className="form-label">Высота</label>
                <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={draft.dimensions.height}
                    onChange={(e) =>
                        updateDraft({
                            dimensions: { ...draft.dimensions, height: Number(e.target.value) },
                        })
                    }
                />
            </div>
            <div className="form-field">
                {' '}
                // Dimentions unit
                <label className="form-label">Ед. изм.</label>
                <select
                    className="form-select"
                    value={draft.dimensions.unit ?? 'cm'}
                    onChange={(e) =>
                        updateDraft({
                            dimensions: {
                                ...draft.dimensions,
                                unit: e.target.value as 'cm' | 'in',
                            },
                        })
                    }
                >
                    <option value="cm">cm</option>
                    <option value="mm">mm</option>
                    <option value="in">in</option>
                </select>
            </div>
        </div>{' '}
        // End of dimentions
        <div className="form-field">
            {' '}
            // Notes frame
            <label className="form-label">Заметки</label>
            <textarea
                className="form-textarea"
                value={draft.notes ?? ''}
                onChange={(e) => updateDraft({ notes: e.target.value || null })}
            />
        </div>
        <fieldset // Price frame
            className="form-field"
            style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}
        >
            <legend className="form-label">Цена (опционально)</legend>
            <div className="form-row-3">
                <input
                    className="form-input"
                    placeholder="EUR"
                    value={draft.price?.currency ?? ''}
                    onChange={(e) => {
                        updateDraft({
                            price: {
                                currency: 'EUR',
                                // eslint-disable-next-line no-constant-binary-expression
                                amount: Number(e.target.value) ?? 0,
                            },
                        });
                    }}
                />
                <input
                    className="form-input"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0"
                    value={draft.price?.amount ?? 0}
                    onChange={(e) =>
                        updateDraft({
                            price: {
                                currency: draft.price?.currency ?? 'EUR',
                                amount: Number(e.target.value),
                            },
                        })
                    }
                />
                <button type="button" className="btn" onClick={() => updateDraft({ price: null })}>
                    Очистить цену
                </button>
            </div>
        </fieldset>
        <div className="form-field">
            {' '}
            // Status frame
            <label className="form-label">Статус доступности</label>
            <select
                className="form-select"
                value={draft.availability}
                onChange={(e) => updateDraft({ availability: e.target.value as Availability })}
            >
                <option value="available">available</option>
                <option value="reserved">reserved</option>
                <option value="sold">sold</option>
                <option value="not_for_sale">not_for_sale</option>
            </select>
        </div>
        <div className="form-actions">
            {' '}
            // SUBMIT BUTTON
            <button className="btn btn--primary" onClick={save} disabled={busy}>
                {busy ? 'Сохраняю…' : 'Сохранить в каталог'}
            </button>
            {savedId && <span className="status">Сохранено (id: {savedId})</span>}
        </div>
    </div>
);
