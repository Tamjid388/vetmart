import type { SalePaymentStatus } from '@prisma/client';

/**
 * Pure sale math shared by the service (and unit tests).
 * Money rule (SRS Rule 11): sellingPrice is VAT-exclusive; every lineTotal
 * and per-line VAT is rounded to 2 decimals at the line level, then summed.
 * NOTE: JS floats — every intermediate result passes through round2 so the
 * 2-decimal ledger values stay exact.
 */

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Start of the current day — expiry is day-granular (Rule 16). */
export const startOfToday = (now = new Date()): Date => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
};

export interface IFifoLot {
  batchId: string;
  stock: number;
  expiryDate: Date | null;
  purchasePrice: number;
}

export interface IFifoAllocation {
  batchId: string;
  qty: number;
  purchasePrice: number;
}

export interface IFifoResult {
  allocations: IFifoAllocation[];
  /** Total unexpired units available across lots. */
  available: number;
  /** True when stock exists but every remaining unit is expired. */
  expiredOnly: boolean;
}

/**
 * FIFO oldest-expiry-first allocation (Rule 16 + 18).
 * Skips zero-stock and expired lots; null expiryDate means "no expiry"
 * and sorts last. One allocation per lot consumed.
 */
export const allocateFifo = (lots: IFifoLot[], qty: number, today = startOfToday()): IFifoResult => {
  const usable = lots.filter((lot) => lot.stock > 0 && (lot.expiryDate === null || lot.expiryDate >= today));
  const available = usable.reduce((sum, lot) => sum + lot.stock, 0);
  const hasExpiredStock = lots.some(
    (lot) => lot.stock > 0 && lot.expiryDate !== null && lot.expiryDate < today,
  );

  const ordered = [...usable].sort((a, b) => {
    if (a.expiryDate === null && b.expiryDate === null) return 0;
    if (a.expiryDate === null) return 1;
    if (b.expiryDate === null) return -1;
    return a.expiryDate.getTime() - b.expiryDate.getTime();
  });

  const allocations: IFifoAllocation[] = [];
  let remaining = qty;
  for (const lot of ordered) {
    if (remaining <= 0) break;
    const take = Math.min(lot.stock, remaining);
    allocations.push({ batchId: lot.batchId, qty: take, purchasePrice: lot.purchasePrice });
    remaining -= take;
  }

  return { allocations, available, expiredOnly: available === 0 && hasExpiredStock };
};

export interface ITotalLine {
  qty: number;
  sellingPrice: number;
  vatPercent: number;
}

export interface IComputedTotals {
  subtotal: number;
  discount: number;
  vatTotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: SalePaymentStatus;
}

export const computeSaleTotals = (
  lines: ITotalLine[],
  discount: number,
  paidAmount: number,
): IComputedTotals => {
  let subtotal = 0;
  let vatTotal = 0;
  for (const line of lines) {
    const lineTotal = round2(line.qty * line.sellingPrice);
    subtotal = round2(subtotal + lineTotal);
    vatTotal = round2(vatTotal + round2(lineTotal * (line.vatPercent / 100)));
  }
  const grandTotal = round2(subtotal - discount + vatTotal);
  const dueAmount = round2(grandTotal - paidAmount);
  const paymentStatus: SalePaymentStatus =
    dueAmount === 0 ? 'PAID' : paidAmount === 0 ? 'DUE' : 'PARTIAL';
  return { subtotal, discount, vatTotal, grandTotal, paidAmount, dueAmount, paymentStatus };
};
