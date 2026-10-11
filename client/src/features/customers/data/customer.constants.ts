import type { CustomerCategory, CustomerListFilters } from '../types/index.ts';

export const CUSTOMER_CATEGORIES: CustomerCategory[] = ['Regular', 'Wholesale'];

export const PAGE_SIZE = 10;

export const DEFAULT_CUSTOMER_FILTERS: CustomerListFilters = {
  search: '',
};
