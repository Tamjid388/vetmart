import { describe, expect, it } from 'vitest';
import { buildLedgerSaleWhere } from './sale.service.js';

describe('buildLedgerSaleWhere', () => {
  it('normalizes area Mirpur to mirpur', () => {
    expect(buildLedgerSaleWhere({ area: 'Mirpur' })).toEqual({ customer: { area: 'mirpur' } });
  });
  it('maps customerName to insensitive contains', () => {
    expect(buildLedgerSaleWhere({ customerName: 'Rahim' })).toEqual({
      customer: { name: { contains: 'Rahim', mode: 'insensitive' } },
    });
  });
  it('maps date range to saleDate gte/lte day boundaries', () => {
    const where = buildLedgerSaleWhere({ dateFrom: '2026-10-01', dateTo: '2026-10-31' }) as any;
    expect(where.saleDate.gte).toBeInstanceOf(Date);
    expect(where.saleDate.lte).toBeInstanceOf(Date);
  });
  it('throws 400 when dateFrom is after dateTo', () => {
    expect(() => buildLedgerSaleWhere({ dateFrom: '2026-10-31', dateTo: '2026-10-01' })).toThrow();
  });
  it('empty customerName does not add customer filter (CASH null-safe)', () => {
    expect(buildLedgerSaleWhere({ customerName: '   ' })).toEqual({});
  });
});
