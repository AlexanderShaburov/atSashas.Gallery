// entities/event/eventFactory.ts
// Factory for creating new draft event pages.
// Source of truth: Docs/EVENT_PAGE_FINALIZATION.md §3.1

import { generateId } from '@/shared/lib/id/generateId';

import { CREATION_DEFAULTS } from './eventDefaults';
import type {
  EventPageData,
  EventPreset,
  ExhibitionEventPage,
  MinimalEventPage,
  PleinAirEventPage,
  WorkshopEventPage,
} from './eventPage.types';

function createWorkshop(id: string, slug: string): WorkshopEventPage {
  const defaults = CREATION_DEFAULTS.workshop;
  return {
    id,
    slug,
    preset: 'workshop',
    status: 'draft',
    title: {},
    subtitle: {},
    description: {},
    location: {},
    ctaLabel: { ...defaults.ctaLabel },
    ctaBridge: { ...defaults.ctaBridge! },
  };
}

function createPleinAir(id: string, slug: string): PleinAirEventPage {
  const defaults = CREATION_DEFAULTS.pleinAir;
  return {
    id,
    slug,
    preset: 'pleinAir',
    status: 'draft',
    title: {},
    subtitle: {},
    description: {},
    location: {},
    ctaLabel: { ...defaults.ctaLabel },
    ctaBridge: { ...defaults.ctaBridge! },
  };
}

function createExhibition(id: string, slug: string): ExhibitionEventPage {
  const defaults = CREATION_DEFAULTS.exhibition;
  return {
    id,
    slug,
    preset: 'exhibition',
    status: 'draft',
    title: {},
    description: {},
    location: {},
    ctaLabel: { ...defaults.ctaLabel },
  };
}

function createMinimal(id: string, slug: string): MinimalEventPage {
  const defaults = CREATION_DEFAULTS.minimal;
  return {
    id,
    slug,
    preset: 'minimal',
    status: 'draft',
    title: {},
    description: {},
    location: {},
    ctaLabel: { ...defaults.ctaLabel },
  };
}

const FACTORIES: Record<EventPreset, (id: string, slug: string) => EventPageData> = {
  workshop: createWorkshop,
  pleinAir: createPleinAir,
  exhibition: createExhibition,
  minimal: createMinimal,
};

export function createEventPage(preset: EventPreset): EventPageData {
  const id = generateId('event');
  const slug = id;
  return FACTORIES[preset](id, slug);
}
