import { ArtItemJSON } from './index';

export type ArtCatalog = {
  catalogVersion: number;
  updatedAt: string;
  order: string[];
  items: Record<string, ArtItemJSON>;
};
