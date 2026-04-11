import type { EventPageData } from '@/entities/event';
import { DataStore } from '../DataStore';

export interface EventPageCatalog {
  version: number;
  updatedAt: string;
  pages: Record<string, EventPageData>;
}

export const eventPagesStore = new DataStore<EventPageCatalog>();
