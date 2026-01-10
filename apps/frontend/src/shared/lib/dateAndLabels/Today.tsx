import type { ISODate } from '@/entities/common';
export function todayISO(): ISODate {
    return new Date().toISOString().slice(0, 10) as ISODate;
}
