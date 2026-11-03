import { describe, expect, it } from 'vitest';
import { buildLedgerPurchaseWhere } from './purchase.service.js';

describe('buildLedgerPurchaseWhere', () => {
  it('maps supplierName to insensitive contains', () => {
    expect(buildLedgerPurchaseWhere({ supplierName: 'Square' })).toEqual({
      supplier: { companyName: { contains: 'Square', mode: 'insensitive' } },
    });
  });
  it('maps date range to purchaseDate gte/lte day boundaries', () => {
    const where = buildLedgerPurchaseWhere({ dateFrom: '2026-10-01', dateTo: '2026-10-31' }) as any;
    expect(where.purchaseDate.gte).toBeInstanceOf(Date);
    expect(where.purchaseDate.lte).toBeInstanceOf(Date);
  });
  it('throws 400 when dateFrom is after dateTo', () => {
    try {
      buildLedgerPurchaseWhere({ dateFrom: '2026-10-31', dateTo: '2026-10-01' });
      throw new Error('expected AppError was not thrown');
    } catch (err) {
      expect((err as { statusCode?: number }).statusCode).toBe(400);
    }
  });
  it('empty supplierName does not add supplier filter', () => {
    expect(buildLedgerPurchaseWhere({ supplierName: '   ' })).toEqual({});
  });
});
