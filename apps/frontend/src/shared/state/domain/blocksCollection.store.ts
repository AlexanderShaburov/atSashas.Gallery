// src/shared/state/domain/blocksCollection.store.ts

import type { BlocksCollectionJSON } from '@/entities/block';
import { DataStore } from '../DataStore';

export const blocksCollectionStore = new DataStore<BlocksCollectionJSON>();
