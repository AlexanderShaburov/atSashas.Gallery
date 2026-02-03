import { TechniquesJson } from '@/entities/art';
import { GridItem } from '@/entities/grid';

export type ProviderProps = { children: React.ReactNode };

export type SingleItemEditorProps = {
    id: string | undefined;
    techniques: TechniquesJson;
    seriesOptions: string[];
    thumb: GridItem | undefined;
    isDirty: boolean;
    onApply: () => void;
    onSave: () => void;
    onDelete: () => void;
};
