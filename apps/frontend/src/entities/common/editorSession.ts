import { ArtItemData } from '@/entities/art';
import { GridItem } from '@/entities/grid';

export type EditorTarget = { mode: 'edit'; item: ArtItemData } | { mode: 'create'; item: GridItem };
