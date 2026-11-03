import { describe, expect, it } from 'vitest';
import { buildSupplierDropdownArgs } from './supplier.service.js';

describe('buildSupplierDropdownArgs', () => {
  it('returns non-deleted lightweight args with default limit', () => {
    expect(buildSupplierDropdownArgs({})).toEqual({
      where: { isDeleted: false },
      orderBy: { companyName: 'asc' },
      take: 20,
      select: { id: true, companyName: true, phone: true },
    });
  });
  it('maps searchTerm to companyName/phone contains', () => {
    const args = buildSupplierDropdownArgs({ searchTerm: 'squ' });
    expect(args.where).toEqual({
      isDeleted: false,
      OR: [
        { companyName: { contains: 'squ', mode: 'insensitive' } },
        { phone: { contains: 'squ' } },
      ],
    });
  });
  it('clamps limit to 1..50', () => {
    expect(buildSupplierDropdownArgs({ limit: '5' }).take).toBe(5);
    expect(buildSupplierDropdownArgs({ limit: '200' }).take).toBe(50);
    expect(buildSupplierDropdownArgs({ limit: 'abc' }).take).toBe(20);
  });
});
