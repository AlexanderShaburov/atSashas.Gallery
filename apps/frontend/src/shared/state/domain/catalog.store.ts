// src/shared/state/domain/catalog.store.ts

import type { ArtCatalog } from '@/entities/catalog';
import { DataStore } from '../DataStore';

export const catalogStore = new DataStore<ArtCatalog>();
