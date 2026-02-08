import { ArtItemData } from '@/entities/art';
import { ArtCatalog } from '@/entities/catalog';
import { SingleItemEditorProps } from '@/pages/admin/catalogEditorPage/catalogEditor.types';
import { CatalogToolbarModel } from '@/shared/ui/SingleEditorToolbar/single-editor-toolbar.types';
export type CatalogEditorScreenMode = 'edit' | 'select';
export type CatalogEditorSession = {
    editorProps: SingleItemEditorProps;
    toolbarModel: CatalogToolbarModel;

    // Data
    catalog: ArtCatalog | undefined;
    draft: ArtItemData | undefined;

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
