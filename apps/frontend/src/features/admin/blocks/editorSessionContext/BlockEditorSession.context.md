## What has to contain and carry session?

1. Block object (object draft?)
2. Editor form information - selected template type - selected ArtItems Ids - Item's captions -
   CatalogEditorSession values:

mode +
ArtCatalog +
BlockCatalog +
BlockEditorTarget +
setBlockEditorTarget() +
FormValues +
setFormValues() +
editorIsReady +
isDirty +
isValid +
saving +
save() +
exit() +
canSave +
loading +
setMode() +

export type BlockEditorMode = 'create' | 'edit';

/\*\*

- Working form values for block editor.
- This is the same "formValue" idea as in Catalog editor.
  \*/
  export interface BlockFormValue {
  id?: string; // undefined while block is new
  kind: Block['kind']; // 'gallery' | 'text' | 'cta' etc.
  layout?: Block['layout']; // may be undefined until user chooses
  tags?: string[]; // optional tags for filtering/search
  dateCreated?: string; // ISO date, will be set on save
  blockContent?: ArtItems[];

          // TODO: add fields for content:
          // gallerySlots?: ...
          // textContent?: ...
          // ctaConfig?: ...

    }
