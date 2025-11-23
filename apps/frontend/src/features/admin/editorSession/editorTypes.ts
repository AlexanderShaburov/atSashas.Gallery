import { Availability, Dimensions, ISODate, Localized, Money } from '@/entities/common';

export interface ArtItemForm {
    id: string;
    dateCreated: ISODate;
    title: Localized | undefined;
    techniques: string[] | undefined;
    availability: Availability | undefined;
    dimensions: Dimensions | undefined;
    price: Money | undefined;
    alt: Localized | undefined;
    series: string | undefined;
    tags: string[] | undefined;
    notes: string | undefined;
}
