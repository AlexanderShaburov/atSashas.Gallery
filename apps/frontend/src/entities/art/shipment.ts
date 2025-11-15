import { Availability, Dimensions, ISODate, Localized, Money } from '@/entities/common';
import { ImagesJSON } from './images';

export type ImageShipment =
    | {
          kind: 'hopper';
          hopperSrc: string; // file url in the hopper
      }
    | {
          kind: 'ready';
          image: ImagesJSON;
      };

export interface ArtShipment {
    readonly id: string;
    dateCreated: ISODate;
    title?: Localized;
    techniques: string[];
    availability: Availability;
    dimensions: Dimensions;
    price?: Money;
    alt?: Localized;
    series?: string;
    tags: string[];
    notes?: string;
    images: ImageShipment;
}
