import { z } from 'zod';
import { PURCHASE_PAYMENT_METHODS } from './purchase.constant.js';

const create = z.object({
  body: z
    .object({
      idempotencyKey: z.string().uuid('idempotencyKey must be a UUID'),
      supplierId: z.string().min(1, 'supplierId is required'),
      items: z
        .array(
          z
            .object({
              productId: z.string().min(1, 'productId is required'),
              qty: z.number().int().min(1, 'qty must be at least 1'),
              purchasePrice: z.number().min(0, 'purchasePrice cannot be negative'),
              batchNumber: z.string().trim().max(255).optional(),
              expiryDate: z.string().min(1, 'expiryDate is required'),
              weightKg: z.number().positive('weightKg must be positive').optional(),
            })
            .strict(),
        )
        .min(1, 'At least one item is required'),
      discount: z.number().min(0, 'discount cannot be negative').optional(),
      paymentMethod: z.enum(PURCHASE_PAYMENT_METHODS).nullish(),
      paidAmount: z.number().min(0, 'paidAmount cannot be negative'),
      notes: z.string().trim().max(1000).optional(),
    })
    .strict(),
});

export const PurchaseValidation = {
  create,
};
