import { TechniquesJson } from '@/entities/art';
import { GridItem } from '@/entities/grid/gridItem';
import { SingleItemEditorProps } from '@/pages/admin/catalogEditorPage/NewCatalogEditor.types';
export type CatalogEditorScreenMode = 'edit' | 'select';
export type CatalogEditorSession = {
    editorProps: SingleItemEditorProps;
    isSelected: boolean;
    canSave: boolean;
    isLoading: boolean;

    /** Toolbar handlers */
    onApply: () => void;
    onSave: () => void;
    onDelete: () => void;
    onExit: () => void;

    /** Derived flags */

    /** UI helpers */
    thumb: GridItem | undefined;
    techniques: TechniquesJson;
    seriesOptions: string[];
};
