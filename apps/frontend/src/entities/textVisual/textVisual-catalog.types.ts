// entities/textVisual/textVisual-catalog.types.ts

import type { TextVisualData } from './textVisual.types';

export interface TextVisualCatalog {
  version: number;
  updatedAt: string;
  order: string[];
  items: Record<string, TextVisualData>;
}
