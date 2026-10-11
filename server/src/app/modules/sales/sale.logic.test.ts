import { describe, expect, it } from 'vitest';
import { allocateFifo, computeSaleTotals, round2, startOfToday } from './sale.logic.js';

describe('sale.logic', () => {
  it('round2 keeps 2-decimal money exact', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(19.995)).toBe(20);
  });

  it('allocateFifo consumes oldest-expiry-first across lots', () => {
    const today = startOfToday();
    const day = 86_400_000;
    const res = allocateFifo(
      [
        { batchId: 'new', stock: 10, expiryDate: new Date(today.getTime() + 60 * day), purchasePrice: 12 },
        { batchId: 'old', stock: 6, expiryDate: new Date(today.getTime() + 10 * day), purchasePrice: 10 },
        { batchId: 'no-expiry', stock: 100, expiryDate: null, purchasePrice: 11 },
      ],
      10,
      today,
    );
    expect(res.available).toBe(116);
    expect(res.expiredOnly).toBe(false);
    expect(res.allocations).toEqual([
      { batchId: 'old', qty: 6, purchasePrice: 10 },
      { batchId: 'new', qty: 4, purchasePrice: 12 },
    ]);
  });

  it('allocateFifo skips expired and zero-stock lots', () => {
    const today = startOfToday();
    const day = 86_400_000;
    const res = allocateFifo(
      [
        { batchId: 'expired', stock: 5, expiryDate: new Date(today.getTime() - day), purchasePrice: 9 },
        { batchId: 'empty', stock: 0, expiryDate: new Date(today.getTime() + 30 * day), purchasePrice: 9 },
        { batchId: 'fresh', stock: 3, expiryDate: new Date(today.getTime() + 30 * day), purchasePrice: 10 },
      ],
      5,
      today,
    );
    expect(res.available).toBe(3);
    expect(res.allocations).toEqual([{ batchId: 'fresh', qty: 3, purchasePrice: 10 }]);
  });

  it('allocateFifo flags expired-only stock', () => {
    const today = startOfToday();
    const res = allocateFifo(
      [{ batchId: 'old', stock: 4, expiryDate: new Date(today.getTime() - 1_000), purchasePrice: 9 }],
      2,
      today,
    );
    expect(res.available).toBe(0);
    expect(res.expiredOnly).toBe(true);
    expect(res.allocations).toEqual([]);
  });

  it('computeSaleTotals applies line-level rounding and derives status', () => {
    // 3 x 33.33 = 99.99; VAT 5% -> 5.00; 2 x 10.005 -> 20.01, VAT 0
    const totals = computeSaleTotals(
      [
        { qty: 3, sellingPrice: 33.33, vatPercent: 5 },
        { qty: 2, sellingPrice: 10.005, vatPercent: 0 },
      ],
      10,
      50,
    );
    expect(totals.subtotal).toBe(120);
    expect(totals.vatTotal).toBe(5);
    expect(totals.grandTotal).toBe(115);
    expect(totals.dueAmount).toBe(65);
    expect(totals.paymentStatus).toBe('PARTIAL');
  });

  it('computeSaleTotals derives PAID and DUE', () => {
    const lines = [{ qty: 1, sellingPrice: 100, vatPercent: 0 }];
    expect(computeSaleTotals(lines, 0, 100).paymentStatus).toBe('PAID');
    expect(computeSaleTotals(lines, 0, 0).paymentStatus).toBe('DUE');
  });
});
