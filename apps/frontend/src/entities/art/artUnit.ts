import type { CurrencyName } from '@/entities/common/money';
import type { ISODate, Localized } from '@/entities/common';
import type { Availability, Dimensions } from '@/entities/common/dimensions';
import type { ImagesJSON } from '@/entities/art/images';

export interface PriceJSON {
    amount: number;
    currency: CurrencyName;
}

export interface ArtItemJSON {
    id?: string;
    title?: Localized;
    dateCreated: ISODate;
    techniques: string[];
    price?: PriceJSON | null;
    availability: Availability;
    series?: string | null;
    tags?: string[];
    notes?: string | null;
    images: ImagesJSON;
    dimensions: Dimensions;
}
