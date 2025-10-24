export const UNITS = ['cm', 'in'];
export type UnitName = (typeof UNITS)[number];

export interface Dimensions {
    width: number;
    height: number;
    unit: UnitName;
}

export type Availability = 'available' | 'reserved' | 'sold' | 'privateCollection' | 'notForSale';
