import type { Supplier } from '@prisma/client';

export type TSupplierResponse = Omit<Supplier, 'payableBalance'> & {
  payableBalance: number;
};

export const toSupplierResponse = (supplier: Supplier): TSupplierResponse => ({
  ...supplier,
  payableBalance: Number(supplier.payableBalance),
});

export interface ICreateSupplierPayload {
  companyName: string;
  contactPerson?: string;
  phone: string;
  address?: string;
  tradeLicense?: string;
  paymentTerms?: number;
  isActive?: boolean;
}

export interface IUpdateSupplierPayload {
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  tradeLicense?: string;
  paymentTerms?: number;
  isActive?: boolean;
}
