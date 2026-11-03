import { getPurchases } from '../../purchases/api/index.ts';
import { getSales } from '../../sales/api/index.ts';
import type { PurchaseListQueryParams } from '../../purchases/types/index.ts';
import type { SaleListQueryParams } from '../../sales/types/index.ts';

export async function getCustomerLedger(params?: SaleListQueryParams) {
  return getSales(params);
}

export async function getVendorLedger(params?: PurchaseListQueryParams) {
  return getPurchases(params);
}
