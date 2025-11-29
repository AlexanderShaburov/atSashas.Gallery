import { ISODate, Localized, Money } from '../common';

export interface EventMeta {
    id: string;
    slug: string; // 'rome-watercolor-workshop-2025'
    title: Localized;
    description: Localized;
    dateTime: ISODate; // или ISODateTime
    durationMinutes?: number;
    location: string;
    price?: Money;
    status: 'draft' | 'scheduled' | 'closed';
    streamSlug: string; // event Stream
}
