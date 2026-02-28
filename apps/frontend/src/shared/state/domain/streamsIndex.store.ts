// src/shared/state/domain/streamsIndex.store.ts

import type { StreamIndexItem } from '@/entities/stream';
import { DataStore } from '../DataStore';

export const streamsIndexStore = new DataStore<StreamIndexItem[]>();
