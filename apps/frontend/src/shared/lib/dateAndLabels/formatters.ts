// shared/lib/dateAndLabels/formatters.ts

import type { Money } from '@/entities/common';

export function formatEventDate(iso: string): string {
    const d = new Date(iso);
    const day = d.getDate();
    const month = d.toLocaleDateString('en', { month: 'short' });
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${hours}:${mins}`;
}

export function formatPrice(price: Money): string {
    const sym =
        price.currency === 'EUR'
            ? '\u20AC'
            : price.currency === 'USD'
              ? '$'
              : price.currency;
    return `${price.amount}${sym}`;
}
