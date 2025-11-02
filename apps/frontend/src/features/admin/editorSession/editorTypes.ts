import { Availability, Dimensions, ISODate, Localized, Money } from '@/entities/common';

export interface FormValues {
    id: string;
    dateCreated?: ISODate;
    title: Localized | undefined;
    category?: string | undefined;
    technique: string | undefined; // techniques[1]
    availability: Availability | undefined;
    dimensions: Dimensions | undefined;
    price: Money | undefined;
    alt: Localized | undefined;
    series: string | undefined;
    tags: string[] | undefined;
    notes: string | undefined;
}
