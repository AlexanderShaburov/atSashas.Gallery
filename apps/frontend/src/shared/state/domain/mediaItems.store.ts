// src/shared/state/domain/mediaItems.store.ts

import type { MediaItemCatalog } from '@/entities/mediaItem';
import { DataStore } from '../DataStore';

export const mediaItemsStore = new DataStore<MediaItemCatalog>();
