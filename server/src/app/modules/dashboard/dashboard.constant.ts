/**
 * Dashboard module constants.
 *
 * Read-only observer over existing rows (sales, purchases, payments,
 * products + batches, customers, suppliers). Thresholds mirror SRS Rule 7
 * so dashboard alerts match the product catalog badges.
 */

export const DASHBOARD_ALERT_LIMIT = 6;

/** Near-expiry window in days (SRS Rule 7). */
export const DASHBOARD_NEAR_EXPIRY_DAYS = 20;

/** Critical stock at or below this fraction of minStock (SRS Rule 7). */
export const DASHBOARD_CRITICAL_RATIO = 0.4;

export const DASHBOARD_KPI_IDS = [
  'sales',
  'purchase',
  'collection',
  'due',
  'customerDue',
  'vendorDue',
  'stockValue',
  'profit',
] as const;

export type TDashboardKpiId = (typeof DASHBOARD_KPI_IDS)[number];
