import { ArtItemData, TechniquesJson } from '@/entities/art';
import { ArtCatalog } from '@/entities/catalog';
import { GridItem } from '@/shared/ui/grid';
import { CatalogToolbarModel } from '@/shared/ui/SingleEditorToolbar/single-editor-toolbar.types';

export type ProviderProps = { children: React.ReactNode };

export type SingleItemEditorProps = {
    // Data:
    id: string | undefined;
    techniquesRange: TechniquesJson;
    seriesOptions: string[];
    thumb: GridItem | undefined;
    draft: ArtItemData | undefined;

    // Derived states:
    isDirty: boolean;
    editorIsReady: boolean;

    // Setter:
    onDraftChange: (next: ArtItemData) => void;
};

export type CatalogEditorScreenMode = 'edit' | 'select';
export type CatalogEditorSession = {
    editorProps: SingleItemEditorProps;
    toolbarModel: CatalogToolbarModel;

    // Data
    catalog: ArtCatalog | undefined;
    draft: ArtItemData | undefined;
    techniquesRange: TechniquesJson;

    /** Currently selected item in grid (select mode) */
    selectedItemId: string | undefined;
    /** Set selected item in grid (select mode) */
    selectItem: (id: string | undefined) => void;

    /** Handlers */
    onEscape: () => void;

    /** Derived flags */
    screenMode: CatalogEditorScreenMode;
    isLoading: boolean;
    isSelected: boolean;
    editorIsReady: boolean;

    // Gone to editorProps!:

    // /** UI helpers */
    // thumb: GridItem | undefined;
    // techniques: TechniquesJson;
    // seriesOptions: string[];
    // screenMode: CatalogEditorScreenMode;
};
