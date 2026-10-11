import {
  CRITICAL_STOCK_RATIO,
  NEAR_EXPIRY_DAYS,
} from '../data/product.constants.ts';
import type {
  ExpiryStatus,
  ProductListFilters,
  ProductResponse,
  ProductStatus,
  StockStatus,
} from '../types/index.ts';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysUntilExpiry(expiryDate: Date | string, today = new Date()) {
  const expiry = startOfDay(new Date(expiryDate));
  const current = startOfDay(today);
  return Math.round((expiry.getTime() - current.getTime()) / 86_400_000);
}

export function getTotalStock(product: ProductResponse): number {
  if (!product.batches || product.batches.length === 0) return 0;
  return product.batches.reduce((sum, b) => sum + b.stock, 0);
}

export function getMinStock(product: ProductResponse): number {
  return product.minStock ?? 0;
}

export function getEarliestExpiry(product: ProductResponse): Date | null {
  if (!product.batches || product.batches.length === 0) return null;
  const dates = product.batches
    .filter((b) => b.expiryDate !== null)
    .map((b) => new Date(b.expiryDate!))
    .filter((d) => !Number.isNaN(d.getTime()));
  if (dates.length === 0) return null;
  return dates.reduce((earliest, d) => (d < earliest ? d : earliest), dates[0]);
}

export function getFirstBatchNumber(product: ProductResponse): string {
  if (!product.batches || product.batches.length === 0) return '';
  return product.batches[0].batchNumber ?? '';
}

export function getCategoryName(product: ProductResponse): string {
  return product.category?.name ?? '';
}

export function getStockStatus(product: ProductResponse): StockStatus {
  const stock = getTotalStock(product);
  const minStock = getMinStock(product);
  if (stock <= 0 || stock < minStock * CRITICAL_STOCK_RATIO) {
    return 'Critical';
  }
  if (stock <= minStock) {
    return 'Low Stock';
  }
  return 'In Stock';
}

export function getExpiryStatus(product: ProductResponse, today = new Date()): ExpiryStatus {
  const expiry = getEarliestExpiry(product);
  if (!expiry) return 'Active';
  const days = daysUntilExpiry(expiry, today);
  if (days < 0) return 'Expired';
  if (days <= NEAR_EXPIRY_DAYS) return 'Near Expiry';
  return 'Active';
}

export function getProductStatus(product: ProductResponse, today = new Date()): ProductStatus {
  const expiryStatus = getExpiryStatus(product, today);
  if (expiryStatus === 'Expired' || expiryStatus === 'Near Expiry') {
    return expiryStatus;
  }
  return getStockStatus(product);
}

export function filterProducts(
  products: ProductResponse[],
  filters?: ProductListFilters,
  today = new Date(),
) {
  if (!filters) return products;

  const query = filters.search.trim().toLowerCase();

  return products.filter((product) => {
    if (query) {
      const haystack = `${product.name} ${getFirstBatchNumber(product)} ${getCategoryName(product)}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (filters.stockStatus !== 'all' && getStockStatus(product) !== filters.stockStatus) {
      return false;
    }

    const expiryStatus = getExpiryStatus(product, today);
    if (filters.expiry === 'active' && expiryStatus === 'Expired') return false;
    if (filters.expiry === 'near' && expiryStatus !== 'Near Expiry') return false;
    if (filters.expiry === 'expired' && expiryStatus !== 'Expired') return false;

    return true;
  });
}
