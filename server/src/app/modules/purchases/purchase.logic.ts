import type { SalePaymentStatus } from '@prisma/client';

/**
 * Pure purchase math shared by the service (and unit tests).
 * Money rule (SRS Rule 20, mirrors Rule 11): purchasePrice is
 * VAT-exclusive; every lineTotal and per-line VAT is rounded to 2 decimals
 * at the line level, then summed.
 * NOTE: JS floats — every intermediate result passes through round2 so the
 * 2-decimal ledger values stay exact.
 */

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export interface IPurchaseTotalLine {
  qty: number;
  purchasePrice: number;
  vatPercent: number;
}

export interface IComputedPurchaseTotals {
  subtotal: number;
  discount: number;
  vatTotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: SalePaymentStatus;
}

export const computePurchaseTotals = (
  lines: IPurchaseTotalLine[],
  discount: number,
  paidAmount: number,
): IComputedPurchaseTotals => {
  let subtotal = 0;
  let vatTotal = 0;
  for (const line of lines) {
    const lineTotal = round2(line.qty * line.purchasePrice);
    subtotal = round2(subtotal + lineTotal);
    vatTotal = round2(vatTotal + round2(lineTotal * (line.vatPercent / 100)));
  }
  const grandTotal = round2(subtotal - discount + vatTotal);
  const dueAmount = round2(grandTotal - paidAmount);
  const paymentStatus: SalePaymentStatus = dueAmount === 0 ? 'PAID' : paidAmount === 0 ? 'DUE' : 'PARTIAL';
  return { subtotal, discount, vatTotal, grandTotal, paidAmount, dueAmount, paymentStatus };
};
