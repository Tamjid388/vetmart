import type { ProductListFilters } from '../../products/types/index.ts';

export const PRODUCT_TYPES = ['MEDICINE', 'FEED'] as const;

// Backend enum values (server ProductUnit). Keep Select values identical
// so the payload passes zod validation without mapping.
export const MEDICINE_UNITS = [
  'PIECE',
  'STRIP',
  'BOTTLE',
  'VIAL',
  'AMPOULE',
  'TUBE',
  'SACHET',
  'BOX',
  'OTHER',
] as const;

export const FEED_UNITS = ['BAG', 'KG', 'LITER', 'OTHER'] as const;

// Legacy export kept for table/filter components that render any unit.
export const PRODUCT_UNITS = [...MEDICINE_UNITS, ...FEED_UNITS].filter(
  (u, i, arr) => arr.indexOf(u) === i,
);

export const MEDICINE_FORMS = [
  'TABLET',
  'CAPSULE',
  'SYRUP',
  'INJECTION',
  'CREAM',
  'OINTMENT',
  'POWDER',
  'DROPS',
  'SUSPENSION',
  'SOLUTION',
  'OTHER',
] as const;

export const PAGE_SIZE = 10;
export const NEAR_EXPIRY_DAYS = 90;
export const CRITICAL_STOCK_RATIO = 0.25;

export const DEFAULT_PRODUCT_FILTERS: ProductListFilters = {
  search: '',
  stockStatus: 'all',
  expiry: 'active',
};
