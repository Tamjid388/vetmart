import { z } from 'zod';
import { PAYMENT_METHODS } from './payment.constant.js';

const create = z.object({
  body: z
    .object({
      // Customer side (E5) or vendor side (E6, Section 4.14) — exactly one
      // of customerId / supplierId; enforced in the service (400).
      customerId: z.string().min(1).optional(),
      saleId: z.string().min(1).nullish(),
      supplierId: z.string().min(1).optional(),
      purchaseId: z.string().min(1).nullish(),
      amount: z.number().positive('amount must be greater than 0'),
      method: z.enum(PAYMENT_METHODS),
      paidAt: z.string().datetime({ offset: true }).optional(),
    })
    .strict(),
});

export const PaymentValidation = {
  create,
};
