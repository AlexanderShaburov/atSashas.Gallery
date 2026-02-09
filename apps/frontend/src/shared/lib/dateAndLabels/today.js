// src/shared/lib/dateAndLabels/today.ts
export function todayISO() {
    return new Date().toISOString().slice(0, 10);
}
