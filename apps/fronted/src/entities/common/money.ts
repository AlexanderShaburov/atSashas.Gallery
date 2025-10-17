export const CURRENCIES = ['USD', 'EUR', 'ILS', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD'] as const;
export type CurrencyName = (typeof CURRENCIES)[number];

export interface Money {
  amount: number;
  currency: CurrencyName;
}
