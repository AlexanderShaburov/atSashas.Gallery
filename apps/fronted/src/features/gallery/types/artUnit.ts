import type {
  Availability,
  CurrencyName,
  Dimensions,
  ISODate,
  ImagesJSON,
  Localized,
} from '@/features/gallery/types';

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
