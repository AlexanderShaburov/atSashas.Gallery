// ...imports stay the same

type CreateFormInitial = Pick<CreateFormValues, 'id'> & Partial<Omit<CreateFormValues, 'id'>>;

export type CreateFormProps = {
    techniques: TechniquesJson;
    initial: CreateFormInitial;
    onChange: (v: CreateFormValues) => void;
    seriesOptions: string[];
    onSave?: (v: CreateFormValues) => void | Promise<void>; // <-- NEW
    submitting?: boolean; // <-- NEW
};

function isValid(v: CreateFormValues) {
    // Minimal “ready to save” checks; expand as needed
    return Boolean(
        v.id && v.dateCreated && v.technique && v.availability && v.dimensions, // you can also check width/height if those exist inside
    );
}

export function CreateForm({
    techniques,
    initial,
    onChange,
    seriesOptions = [],
    onSave,
    submitting = false,
}: CreateFormProps) {
    // ...state and memos unchanged

    const canSave = isValid(values) && !submitting;

    return (
        <form className="cf-form" onSubmit={(e) => e.preventDefault()}>
            {/* ...all existing fields... */}

            {/* Actions */}
            <div className="cf-actions">
                <button
                    type="button"
                    className="cf-btn cf-btn--primary"
                    disabled={!canSave}
                    onClick={() => {
                        if (!onSave) return;
                        onSave(values);
                    }}
                    title={!isValid(values) ? 'Fill required fields to enable Save' : 'Save item'}
                >
                    {submitting ? 'Saving…' : 'Save'}
                </button>
            </div>
        </form>
    );
}
