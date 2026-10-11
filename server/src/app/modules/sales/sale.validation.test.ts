import { describe, expect, it } from 'vitest';
import { SaleValidation } from './sale.validation.js';

const item = { productId: 'prod_1', qty: 2 };

const baseBody = {
  idempotencyKey: '123e4567-e89b-12d3-a456-426614174000',
  items: [item],
  paidAmount: 100,
};

describe('sale.validation (E4b cash customer)', () => {
  it('defaults a legacy body without saleType to REGISTERED', () => {
    const parsed = SaleValidation.create.parse({
      body: { ...baseBody, customerId: 'cust_1', paymentMethod: 'CASH' },
    });
    expect(parsed.body.saleType).toBe('REGISTERED');
  });

  it('rejects a REGISTERED sale without customerId', () => {
    expect(() =>
      SaleValidation.create.parse({ body: { ...baseBody, saleType: 'REGISTERED' } }),
    ).toThrow(/customerId is required/);
  });

  it('accepts a minimal CASH sale without customerId', () => {
    const parsed = SaleValidation.create.parse({
      body: { ...baseBody, saleType: 'CASH' },
    });
    expect(parsed.body.saleType).toBe('CASH');
  });

  it('rejects a CASH sale carrying customerId', () => {
    expect(() =>
      SaleValidation.create.parse({
        body: { ...baseBody, saleType: 'CASH', customerId: 'cust_1' },
      }),
    ).toThrow(/must not be sent for a cash sale/);
  });

  it('rejects a CASH sale with a non-CASH payment method', () => {
    for (const method of ['BKASH', 'NAGAD', 'CARD']) {
      expect(() =>
        SaleValidation.create.parse({
          body: { ...baseBody, saleType: 'CASH', paymentMethod: method },
        }),
      ).toThrow(/must be CASH for a cash sale/);
    }
  });

  it('accepts a CASH sale with explicit CASH method or none', () => {
    expect(
      SaleValidation.create.parse({
        body: { ...baseBody, saleType: 'CASH', paymentMethod: 'CASH' },
      }).body.paymentMethod,
    ).toBe('CASH');
    expect(
      SaleValidation.create.parse({ body: { ...baseBody, saleType: 'CASH' } }).body
        .paymentMethod,
    ).toBeUndefined();
  });
});
