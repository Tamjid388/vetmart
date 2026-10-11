import type { Customer, Payment, Purchase, Sale, SalePaymentMethod, Supplier, User } from '@prisma/client';

export interface ICreatePaymentPayload {
  customerId?: string;
  saleId?: string | null;
  /** E6 vendor side: exactly one of customerId / supplierId (service check). */
  supplierId?: string;
  purchaseId?: string | null;
  amount: number;
  method: SalePaymentMethod;
  paidAt?: string;
}

export type TPaymentCustomer = Pick<Customer, 'id' | 'name' | 'phone'>;

export type TPaymentSale = Pick<Sale, 'id' | 'invoiceNo' | 'grandTotal' | 'dueAmount'>;

export type TPaymentSupplier = Pick<Supplier, 'id' | 'companyName' | 'phone'>;

export type TPaymentPurchase = Pick<Purchase, 'id' | 'invoiceNo' | 'grandTotal' | 'dueAmount'>;

export type TPaymentCollector = Pick<User, 'id' | 'name' | 'email'>;

export type TPaymentResponse = Omit<Payment, 'amount'> & {
  amount: number;
  customer?: TPaymentCustomer | null;
  sale?: TPaymentSale | null;
  supplier?: TPaymentSupplier | null;
  purchase?: TPaymentPurchase | null;
  collectedByUser?: TPaymentCollector;
};

export type TPopulatedPayment = Payment & {
  customer?: TPaymentCustomer | null;
  sale?: TPaymentSale | null;
  supplier?: TPaymentSupplier | null;
  purchase?: TPaymentPurchase | null;
  collectedByUser?: TPaymentCollector | null;
};

const toNumber = (v: unknown): number => Number(v as number | string);

export const toPaymentResponse = (payment: TPopulatedPayment): TPaymentResponse => {
  const { amount, customer, sale, supplier, purchase, collectedByUser, ...rest } = payment;
  void amount;
  return {
    ...rest,
    amount: toNumber(payment.amount),
    ...(customer !== undefined ? { customer } : {}),
    ...(sale !== undefined ? { sale } : {}),
    ...(supplier !== undefined ? { supplier } : {}),
    ...(purchase !== undefined ? { purchase } : {}),
    ...(collectedByUser ? { collectedByUser } : {}),
  };
};
