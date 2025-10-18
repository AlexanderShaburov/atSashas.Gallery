export interface Dimensions {
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export type Availability = 'available' | 'reserved' | 'sold' | 'privateCollection' | 'notForSale';
