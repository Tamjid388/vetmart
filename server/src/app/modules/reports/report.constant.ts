/**
 * Reports module constants.
 *
 * Read-only observer over existing rows (SRS Rule 1: admin only — every
 * report surfaces lot costs, profit, or shop-wide dues). No writes.
 */

export const REPORT_TYPES = [
  'sales',
  'purchases',
  'profit',
  'customer-dues',
  'vendor-dues',
  'stock',
  'expiry',
] as const;

export type TReportType = (typeof REPORT_TYPES)[number];

export const REPORT_PAYMENT_STATUSES = ['PAID', 'PARTIAL', 'DUE'] as const;

export const REPORT_STOCK_STATUSES = ['In Stock', 'Low Stock', 'Critical'] as const;

export const REPORT_EXPIRY_STATUSES = ['Expired', 'Near Expiry'] as const;

export const REPORT_MAX_LIMIT = 100;

/** Default near-expiry window (days) when ?days= is absent. Mirrors SRS Rule 7. */
export const REPORT_DEFAULT_EXPIRY_DAYS = 20;
