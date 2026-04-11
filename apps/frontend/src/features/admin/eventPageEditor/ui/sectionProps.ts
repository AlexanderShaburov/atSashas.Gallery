// features/admin/eventPageEditor/ui/sectionProps.ts
// Shared types for editor section components.

import type { EventPreset } from '@/entities/event';
import type { Localized } from '@/entities/common';

export type SectionProps = {
  preset: EventPreset;
  record: Record<string, unknown>;
  set: (field: string, value: unknown) => void;
};

export function getLoc(record: Record<string, unknown>, field: string): Localized | undefined {
  return record[field] as Localized | undefined;
}

export function getStr(record: Record<string, unknown>, field: string): string {
  return (record[field] as string | undefined) ?? '';
}

export function getNum(record: Record<string, unknown>, field: string): number | undefined {
  return record[field] as number | undefined;
}
