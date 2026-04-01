// src/shared/state/domain/textVisuals.store.ts

import type { TextVisualCatalog } from '@/entities/textVisual';
import { DataStore } from '../DataStore';

export const textVisualsStore = new DataStore<TextVisualCatalog>();
