import { ArtItemData } from '@/entities/art';
import { GridItem } from '@/shared/ui/grid';

export type EditorTarget = { mode: 'edit'; item: ArtItemData } | { mode: 'create'; item: GridItem };
