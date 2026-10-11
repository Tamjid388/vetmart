import type { PurchaseListFilters, PurchasePaymentMethod } from '../types/index.ts';

export const PAGE_SIZE = 10;

export const DEFAULT_PURCHASE_FILTERS: PurchaseListFilters = {
  search: '',
  paymentStatus: 'all',
};

export const PAYMENT_METHOD_OPTIONS: { value: PurchasePaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BKASH', label: 'bKash' },
  { value: 'NAGAD', label: 'Nagad' },
  { value: 'CARD', label: 'Card' },
];
