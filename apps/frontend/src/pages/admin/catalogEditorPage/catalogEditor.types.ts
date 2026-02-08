import { ArtItemData, TechniquesJson } from '@/entities/art';
import { GridItem } from '@/entities/grid';

export type ProviderProps = { children: React.ReactNode };

export type SingleItemEditorProps = {
    // Data:
    id: string | undefined; // ???????？
    techniquesRange: TechniquesJson;
    seriesOptions: string[];
    thumb: GridItem | undefined;
    draft: ArtItemData | undefined;

    // Derived states:
    isDirty: boolean;
    editorIsReady: boolean;

    // Setter:
    onDraftChange: (next: ArtItemData) => void;
    // onApply: () => void;
    // onSave: () => void;
    // onDelete: () => void;
};
