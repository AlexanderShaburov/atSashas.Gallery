export type EntityLifecycle = 'template' | 'draft' | 'saved';

export type MetaAction = 'create' | 'edit' | 'idle';

export interface MetaIntent {
    action: MetaAction;
}
