import type { ProductResponse } from '../../products/types/index.ts';
import {
  getEarliestExpiry,
  getExpiryStatus,
  getMinStock,
  getStockStatus,
  getTotalStock,
} from '../../products/utils/index.ts';
import { ALERT_LIMIT } from '../data/dashboard.constants.ts';
import type { ExpiryAlertRow, LowStockAlertRow } from '../types/index.ts';

export function getLowStockAlerts(products: ProductResponse[]): LowStockAlertRow[] {
  return products
    .map((product) => ({
      id: product.id,
      name: product.name,
      minStock: getMinStock(product),
      stock: getTotalStock(product),
      status: getStockStatus(product),
    }))
    .filter((row): row is LowStockAlertRow => row.status !== 'In Stock')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'Critical' ? -1 : 1;
      return a.stock / a.minStock - b.stock / b.minStock;
    })
    .slice(0, ALERT_LIMIT);
}

export function getExpiryAlerts(products: ProductResponse[]): ExpiryAlertRow[] {
  return products
    .map((product) => {
      const earliest = getEarliestExpiry(product);
      return {
        id: product.id,
        name: product.name,
        expiryDate: earliest ? earliest.toISOString().slice(0, 10) : '',
        status: getExpiryStatus(product),
      };
    })
    .filter((row): row is ExpiryAlertRow => row.status !== 'Active')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'Expired' ? -1 : 1;
      return a.expiryDate.localeCompare(b.expiryDate);
    })
    .slice(0, ALERT_LIMIT);
}
