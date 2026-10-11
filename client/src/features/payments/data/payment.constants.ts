import type { PaymentListFilters, PaymentMethod } from '../types/index.ts';

export const PAGE_SIZE = 10;

export const DEFAULT_PAYMENT_FILTERS: PaymentListFilters = {
  search: '',
  method: 'all',
};

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BKASH', label: 'bKash' },
  { value: 'NAGAD', label: 'Nagad' },
  { value: 'CARD', label: 'Card' },
];
