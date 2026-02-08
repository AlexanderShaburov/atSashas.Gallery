export type EntityLifecycle = 'template' | 'draft' | 'saved' | 'published';

export type MetaAction = 'create' | 'edit' | 'idle';

export interface MetaIntent {
    action: MetaAction;
}
