import type { Customer } from '@prisma/client';

export type TCustomerResponse = Omit<Customer, 'dueBalance'> & {
  dueBalance: number;
};

export const toCustomerResponse = (customer: Customer): TCustomerResponse => ({
  ...customer,
  dueBalance: Number(customer.dueBalance),
});

export interface ICreateCustomerPayload {
  name: string;
  phone: string;
  address?: string;
  area?: string;
  category?: string;
  isActive?: boolean;
}

export interface IUpdateCustomerPayload {
  name?: string;
  phone?: string;
  address?: string;
  area?: string;
  category?: string;
  isActive?: boolean;
}
