import { describe, expect, it } from 'vitest';
import { buildCustomerDropdownArgs } from './customer.service.js';

describe('buildCustomerDropdownArgs', () => {
  it('returns active-only lightweight args with default limit', () => {
    expect(buildCustomerDropdownArgs({})).toEqual({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
      take: 20,
      select: { id: true, name: true, phone: true, area: true },
    });
  });
  it('maps searchTerm to name/phone insensitive contains', () => {
    const args = buildCustomerDropdownArgs({ searchTerm: 'rah' });
    expect(args.where).toEqual({
      isDeleted: false,
      OR: [
        { name: { contains: 'rah', mode: 'insensitive' } },
        { phone: { contains: 'rah' } },
      ],
    });
  });
  it('clamps limit to 1..50', () => {
    expect(buildCustomerDropdownArgs({ limit: '5' }).take).toBe(5);
    expect(buildCustomerDropdownArgs({ limit: '200' }).take).toBe(50);
    expect(buildCustomerDropdownArgs({ limit: 'abc' }).take).toBe(20);
  });
});
