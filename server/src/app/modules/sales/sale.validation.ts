import { z } from 'zod';
import { SALE_PAYMENT_METHODS, SALE_TYPES } from './sale.constant.js';

const create = z.object({
  body: z
    .object({
      idempotencyKey: z.string().uuid('idempotencyKey must be a UUID'),
      // Defaults to REGISTERED so pre-E4b clients keep working unchanged.
      saleType: z.enum(SALE_TYPES).default('REGISTERED'),
      // Required for REGISTERED; forbidden for CASH (enforced in superRefine).
      customerId: z.string().min(1, 'customerId is required').optional(),
      items: z
        .array(
          z
            .object({
              productId: z.string().min(1, 'productId is required'),
              qty: z.number().int().min(1, 'qty must be at least 1'),
            })
            .strict(),
        )
        .min(1, 'At least one item is required'),
      discount: z.number().min(0, 'discount cannot be negative').optional(),
      paymentMethod: z.enum(SALE_PAYMENT_METHODS).nullish(),
      paidAmount: z.number().min(0, 'paidAmount cannot be negative'),
      notes: z.string().trim().max(1000).optional(),
    })
    .strict()
    .superRefine((val, ctx) => {
      if (val.saleType === 'CASH') {
        if (val.customerId !== undefined) {
          ctx.addIssue({
            code: 'custom',
            path: ['customerId'],
            message: 'customerId must not be sent for a cash sale',
          });
        }
        if (
          val.paymentMethod !== undefined &&
          val.paymentMethod !== null &&
          val.paymentMethod !== 'CASH'
        ) {
          ctx.addIssue({
            code: 'custom',
            path: ['paymentMethod'],
            message: 'paymentMethod must be CASH for a cash sale',
          });
        }
      } else if (val.customerId === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['customerId'],
          message: 'customerId is required',
        });
      }
    }),
});

export const SaleValidation = {
  create,
};
