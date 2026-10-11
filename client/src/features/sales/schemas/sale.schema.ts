import axios from 'axios';
import { getApiErrorMessage } from '../../../lib/axios/axios.ts';
import type { ShortStockLine } from '../types/index.ts';

export function isShortStockError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 409;
}

export function getShortStockLines(error: unknown): ShortStockLine[] {
  if (!axios.isAxiosError<{ details?: { lines?: ShortStockLine[] } }>(error)) return [];
  const lines = error.response?.data?.details?.lines;
  return Array.isArray(lines) ? lines : [];
}

/** Maps server errors to POS-friendly messages; 409 carries per-line availability. */
export function getSaleSubmitErrorMessage(error: unknown): string {
  if (isShortStockError(error)) {
    const lines = getShortStockLines(error);
    if (lines.length > 0) {
      const first = lines[0];
      if (first.expiredOnly) {
        return `Only expired stock left for “${first.productName}” — sale blocked.`;
      }
      return `Not enough stock for “${first.productName}” (need ${first.requested}, have ${first.available}) — sale blocked.`;
    }
  }
  return getApiErrorMessage(error, 'Failed to complete sale');
}

export const saleSchema = {
  customerId: [{ required: true, message: 'Select a customer first' }],
};
