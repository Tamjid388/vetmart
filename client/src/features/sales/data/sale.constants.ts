import type { SaleListFilters, SalePaymentMethod } from '../types/index.ts';

export const PAGE_SIZE = 10;

export const DEFAULT_SALE_FILTERS: SaleListFilters = {
  search: '',
  paymentStatus: 'all',
  saleType: 'all',
};

export const PAYMENT_METHOD_OPTIONS: { value: SalePaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BKASH', label: 'bKash' },
  { value: 'NAGAD', label: 'Nagad' },
  { value: 'CARD', label: 'Card' },
];
