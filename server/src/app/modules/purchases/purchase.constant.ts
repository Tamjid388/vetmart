// Mirrors SalePaymentMethod (SRS 4.12 reuses the sale payment-method enum;
// Prisma type is shared, this array is only for Zod validation).
export const PURCHASE_PAYMENT_METHODS = ['CASH', 'BKASH', 'NAGAD', 'CARD'] as const;

export const PURCHASE_PAYMENT_STATUSES = ['PAID', 'PARTIAL', 'DUE'] as const;

export const PurchaseSearchableFields = ['invoiceNo'];
