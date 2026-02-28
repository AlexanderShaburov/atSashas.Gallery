// src/shared/state/domain/events.store.ts

import type { EventCatalog } from '@/entities/event';
import { DataStore } from '../DataStore';

export const eventsStore = new DataStore<EventCatalog>();
