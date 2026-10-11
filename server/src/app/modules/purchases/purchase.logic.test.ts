import { describe, expect, it } from 'vitest';
import { computePurchaseTotals, round2 } from './purchase.logic.js';

describe('purchase.logic', () => {
  it('round2 keeps 2-decimal money exact', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(19.995)).toBe(20);
  });

  it('computePurchaseTotals applies line-level rounding and derives status', () => {
    // 10 x 45.50 = 455.00; VAT 5% -> 22.75; 4 x 12.335 -> 49.34, VAT 0
    const totals = computePurchaseTotals(
      [
        { qty: 10, purchasePrice: 45.5, vatPercent: 5 },
        { qty: 4, purchasePrice: 12.335, vatPercent: 0 },
      ],
      10,
      100,
    );
    expect(totals.subtotal).toBe(504.34);
    expect(totals.vatTotal).toBe(22.75);
    expect(totals.grandTotal).toBe(517.09);
    expect(totals.dueAmount).toBe(417.09);
    expect(totals.paymentStatus).toBe('PARTIAL');
  });

  it('computePurchaseTotals derives PAID and DUE', () => {
    const lines = [{ qty: 2, purchasePrice: 100, vatPercent: 0 }];
    expect(computePurchaseTotals(lines, 0, 200).paymentStatus).toBe('PAID');
    expect(computePurchaseTotals(lines, 0, 0).paymentStatus).toBe('DUE');
    expect(computePurchaseTotals(lines, 0, 0).dueAmount).toBe(200);
  });
});
