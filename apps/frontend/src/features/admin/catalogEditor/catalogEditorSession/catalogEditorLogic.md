# Catalog editor logic:

## States:

1. identity: EditorTarget -> used as logic flag and editing object data
2. mode: 'create' | 'edit' -> used in UI
3. catalog: ArtCatalog -> ArtItem array data
4. hopper: CatalogGridItem[] -> hopper data
5. techniques: TechniquesJson -> database analytics results
6. seriesOptions: string[] -> database analytics results
7. thumb: GridItem | undefined -> current thumbnail

## Memos:

1. key: EditorKey -> external session data store access key
2. scope: EditorKey | null -> external dirty state store access key
3. isDirty: boolean -> local calculated dirty state
4. isValid actualizer
5. canSave calculator
6. editorIsReady calculator

## Hooks:

1. sessionData -> session data object
2. values -> draft
3. snapshot -> snapshot

## Effects:

1. isDirty local dirty actualizer
2. isDirty local <-> external states synchronizer
3. OneTimeRunning actualize techniques and series statistics
4. Synchronize catalog to global context provider depends on catalog
5. Align thumb, mode, draft and snapshot with selected identity, depends on identity
6. Mount bootstrap -> journey aware

## Methods:

1. refreshBase: () => Promise<void> -> download catalog and hopper actual content;
2. setValues: values setter (values - harmonized to UI draft data)
3. resetSession: () => Promise<void> - reset identity, mode, thumb and clear external session data for current key

## UI handlers:

1. save: () => Promise<void> -> sanitize, buildShipment, save, refreshBase and end editor session
