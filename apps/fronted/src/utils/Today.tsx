import type { ISODate } from '@/features/gallery/types';
export function todayISO(): ISODate {
  return new Date().toISOString().slice(0, 10) as ISODate;
}
